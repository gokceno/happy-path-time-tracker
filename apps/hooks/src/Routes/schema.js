import { DateTime, Interval, Duration } from 'luxon';
import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt, GraphQLInputObjectType } from 'graphql';
import { Projects, Tasks, Timers, Metadata } from '@happy-path/graphql-entities';
import { Backend as GraphQLClient } from '@happy-path/graphql-client';
import { calculateDuration, metadata as parseMetadata } from '@happy-path/calculator';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      me: {
        type: new GraphQLObjectType({
          name: 'Me',
          fields: {
            email: { type: GraphQLString }
          }
        }),
        resolve: async (_, { name }, context) => {
          return {
            email: context.email,
          }
        },
      },
      timers: {
        args: {
          startsAt: { type: new GraphQLNonNull(GraphQLString) },
          endsAt: { type: new GraphQLNonNull(GraphQLString) }
        },
        type: new GraphQLList(new GraphQLObjectType({
          name: 'Timers',
          fields: {
            id: { type: GraphQLInt },
            startsAt: { type: GraphQLString },
            endsAt: { type: GraphQLString },
            duration: { type: GraphQLInt },
            totalDuration: { type: GraphQLInt },
            notes: { type: GraphQLString },
            relations: { type: new GraphQLList(GraphQLString) },
            project: {type: new GraphQLObjectType({
              name: 'Project',
              fields: {
                id: { type: GraphQLInt },
                name: { type: GraphQLString },
            }})},
            task: {type: new GraphQLObjectType({
              name: 'Task',
              fields: {
                id: { type: GraphQLInt },
                name: { type: GraphQLString },
            }})},
          }
        })),
        resolve: async (_, { startsAt, endsAt }, context) => {
          const timers = Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' });
          return (await timers.findTimersByUserId({ startsAt, endsAt, email: context.email })).map(item => ({ 
            id: item.id, 
            startsAt: item.starts_at,
            endsAt: item.ends_at,
            duration: item.duration,
            totalDuration: item.total_duration,
            notes: item.notes,
            relations: item.relations,
            project: { 
              id: item.task.projects_id.id,
              name: item.task.projects_id.project_name 
            },
            task: { 
              id: item.task.id,
              name: item.task.tasks_id.task_name 
            }
          }));
        },
      },
      projects: {
        type: new GraphQLList(new GraphQLObjectType({
          name: 'Projects',
          fields: {
            id: { type: GraphQLString },
            projectName: { type: GraphQLString }
          }
        })),
        resolve: async (_, { name }, context) => {
          const projects = Projects({ client: GraphQLClient() });
          return (await projects.list()).map(item => ({ id: item.id, projectName: item.project_name }));
        },
      },
      tasks: {
        type: new GraphQLList(new GraphQLObjectType({
          name: 'Tasks',
          fields: {
            id: { type: GraphQLString },
            taskName: { type: GraphQLString }
          }
        })),
        args: {
          projectId: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: async (_, { projectId }, context) => {
          const tasks = await Tasks({ client: GraphQLClient(), queryParams: { projectId } }).list();
          const project = await Projects({ client: GraphQLClient() }).findProjectById({ projectId });
          const metadata = await Metadata({ client: GraphQLClient() }).get();
          const { groups, task_modifiers: taskModifiers } = parseMetadata([metadata, project.metadata]);
          let tasksToFilter = [];
          if(taskModifiers?.deny_list !== undefined) { 
            const { deny_list: denyList } = taskModifiers;
            denyList
              .filter(
                deny => deny.groups.filter(deniedGroup => {
                  const filteredGroups = groups.filter(group => {
                    return (group[deniedGroup]?.members || []).indexOf(context.email) !== -1;
                  });
                  return filteredGroups.length > 0 && Object.keys(filteredGroups[0]).includes(deniedGroup);
                }).length
              )
              .map(deny => tasksToFilter.push(...deny.tasks));
          }
          return tasks
            .filter(item => !tasksToFilter.includes(item.tasks_id.task_name))
            .map(item => ({ id: item.id, taskName: item.tasks_id.task_name }));
        },
      },
      stats: {
        type: new GraphQLObjectType({
          name: 'Stats',
          fields: {
            byDate: { type: new GraphQLList(new GraphQLObjectType({
              name: 'ByDate',
              fields: {
                date: { type: GraphQLString },
                totalDuration: { type: GraphQLInt }
              }
            }))},
            byInterval: { type: new GraphQLList(new GraphQLObjectType({
              name: 'ByInterval',
              fields: {
                type: { type: GraphQLString },
                startsAt: { type: GraphQLString },
                endsAt: { type: GraphQLString },
                totalDuration: { type: GraphQLInt }
              }
            }))}
          }
        }),
        args: {
          date: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (_, { date }, context) => {
          const timers = await Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' }).findTimersByUserId({ 
            startsAt: DateTime.fromISO(date, { zone: 'UTC' }).startOf('month').minus({ week: 1 }).toUTC(),
            endsAt: DateTime.fromISO(date, { zone: 'UTC' }).endOf('month').plus({ week: 1 }).toUTC(), 
            email: context.email 
          });
          if(timers.length == 0) return {};
          const monthlyInterval = Interval.fromDateTimes(
            DateTime.fromISO(date).startOf('month'),
            DateTime.fromISO(date).endOf('month')
          );
          const weeklyInterval = Interval.fromDateTimes(
            DateTime.fromISO(date,).startOf('week'),
            DateTime.fromISO(date).endOf('week')
          );
          const byDate = weeklyInterval.splitBy(Duration.fromObject({ day: 1 })).map(weekday => ({
            totalDuration: timers
              .filter(timer => DateTime.fromISO(timer.starts_at, { zone: 'UTC' }).setZone(process.env.TIMEZONE || 'UTC').toISODate() == weekday.start.toISODate())
              .reduce((acc, timer) => acc + timer.total_duration, 0),
            date: weekday.start.toISODate()
          }));
          const byWeeklyIntervals = monthlyInterval.splitBy(Duration.fromObject({ week: 1 })).map(week => ({
            type: 'week',
            totalDuration: timers.filter(timer => DateTime.fromISO(timer.starts_at, { zone: 'UTC' }).setZone(process.env.TIMEZONE || 'UTC') >= week.start && DateTime.fromISO(timer.ends_at, { zone: 'UTC' }).setZone(process.env.TIMEZONE || 'UTC') <= week.end).reduce((acc, timer) => acc + timer.total_duration, 0),
            startsAt: week.start.setZone(process.env.TIMEZONE || 'UTC').toISO(),
            endsAt: week.end.setZone(process.env.TIMEZONE || 'UTC').toISO(),
          }));
          return {
            byDate,
            byInterval: [
              {
                type: 'month',
                startsAt: DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).startOf('month').toISO(),
                endsAt: DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).endOf('month').toISO(),
                totalDuration: timers.reduce((acc, timer) => acc + timer.total_duration, 0)
              }, 
              ...byWeeklyIntervals,
            ]
          };
        },
      },
      timer: {
        args: {
          id: { type: GraphQLInt },
        },
        type: new GraphQLObjectType({
          name: 'Timer',
          fields: {
            id: { type: GraphQLInt },
            startsAt: { type: GraphQLString },
            endsAt: { type: GraphQLString },
            duration: { type: GraphQLInt },
            totalDuration: { type: GraphQLInt },
            notes: { type: GraphQLString },
            relations: { type: new GraphQLList(GraphQLString) },
          }
        }),
        resolve: async (_, { id }, context) => {
          const timers = Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' });
          const timer = await timers.findTimerById({ timerId: id });
          return {
            id: timer?.id,
            startsAt: timer?.starts_at,
            endsAt: timer?.ends_at,
            duration: timer?.duration,
            totalDuration: timer?.total_duration,
            notes: timer?.notes,
            relations: timer?.relations,
          }
        },
      },
    },
  }),
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      start: {
        type: new GraphQLObjectType({
          name: 'Start',
          fields: {
            id: { type: GraphQLString },
            startsAt: { type: GraphQLString },
            endsAt: { type: GraphQLString },
            duration: { type: GraphQLInt },
          }
        }),
        args: {
          projectTaskId: { type: new GraphQLNonNull(GraphQLInt) },
          duration: { type: GraphQLInt },
          notes: { type: GraphQLString },
          relations: { type: new GraphQLList(GraphQLString) },
        },
        resolve: async (_, { projectTaskId, startsAt, duration, notes, relations }, context) => {
          const timers = Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' });
          const timer = await timers.start({
            projectTaskId,
            email: context.email,
            duration,
            relations,
            taskComment: notes
          });
          if(timer.status == true) {
            return { 
              id: timer.data.id,
              startsAt: timer.data.starts_at,
              endsAt: timer.data.ends_at,
              duration: +timer.data.duration,
            };
          }
        },
      },
      stop: {
        type: new GraphQLObjectType({
          name: 'Stop',
          fields: {
            id: { type: GraphQLString },
            startsAt: { type: GraphQLString },
            endsAt: { type: GraphQLString },
            totalDuration: { type: GraphQLInt },
          }
        }),
        args: {
          timerId: { type: new GraphQLNonNull(GraphQLInt) },
        },
        resolve: async (_, { timerId }, context) => {
          const timers = Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' });
          const timer = await timers.stop({ timerId, email: context.email });          
          if(timer.status == true) {
            return { 
              id: timer.data.id,
              startsAt: timer.data.starts_at,
              endsAt: timer.data.ends_at,
              totalDuration: +timer.data.total_duration,
            };
          }
          else {
            throw new Error('Running timer not found.');
          }
        },
      },
      log: {
        type: new GraphQLObjectType({
          name: 'Log',
          fields: {
            id: { type: GraphQLString },
            startsAt: { type: GraphQLString },
            endsAt: { type: GraphQLString },
            duration: { type: GraphQLInt },
          }
        }),
        args: {
          projectTaskId: { type: new GraphQLNonNull(GraphQLInt) },
          duration: { type: GraphQLInt },
          notes: { type: GraphQLString },
          relations: { type: new GraphQLList(GraphQLString) },
          startsAt: { type: GraphQLString },
          endsAt: { type: GraphQLString }
        },
        resolve: async (_, { projectTaskId, duration, notes, startsAt, endsAt, relations }, context) => {
          const timers = Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' });
          const timer = await timers.log({
            projectTaskId,
            email: context.email,
            duration,
            relations,
            taskComment: notes,
            startsAt,
            endsAt
          });
          if(timer.status == true) {
            return { 
              id: timer.data.id,
              startsAt: timer.data.starts_at,
              endsAt: timer.data.ends_at,
              duration: +timer.data.duration,
            };
          }
        },
      },
      remove: {
        type: new GraphQLObjectType({
          name: 'Remove',
          fields: {
            id: { type: GraphQLInt }
          }
        }),
        args: {
          timerId: { type: new GraphQLNonNull(GraphQLInt) },
        },
        resolve: async (_, { timerId }, context) => {
          const timers = Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' });
          const timer = await timers.remove({ timerId, email: context.email });
          if(timer.status == true) {
            return { id: timer.data.id };
          }
        },
      },
      update: {
        type: new GraphQLObjectType({
          name: 'Update',
          fields: {
            id: { type: GraphQLInt },
            startsAt: { type: GraphQLString },
            endsAt: { type: GraphQLString },
            duration: { type: GraphQLInt },
            totalDuration: { type: GraphQLInt },
          }
        }),
        args: {
          timerId: { type: new GraphQLNonNull(GraphQLInt) },
          input: { type: new GraphQLInputObjectType({
            name: 'Input',
            fields: {
              duration: { type: GraphQLInt },
              startsAt: { type: GraphQLString },
              endsAt: { type: GraphQLString },
              notes: { type: GraphQLString },
              relations: { type: new GraphQLList(GraphQLString) },
            }
          })}
        },
        resolve: async (_, { timerId, input }, context) => {
          const timers = Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' });
          const { totalDuration, totalDurationInHours } = calculateDuration({ 
            startsAt: input?.startsAt, 
            endsAt: input?.endsAt, 
            duration: input?.duration, 
          });  
          const timer = await timers.update({ timerId, data: {
            duration: input?.duration,
            totalDuration, 
            totalDurationInHours,
            startsAt: input?.startsAt,
            endsAt: input?.endsAt,
            taskComment: input?.notes,
            relations: input?.relations,
          }});
          if(timer.status == true) {
            return { 
              id: timer.data.id,
              startsAt: timer.data.starts_at,
              endsAt: timer.data.ends_at,
              duration: +timer.data.duration,
              totalDuration: +timer.data.total_duration,
            };
          }
        },
      },
      restart: {
        type: new GraphQLObjectType({
          name: 'Restart',
          fields: {
            id: { type: GraphQLInt },
            startsAt: { type: GraphQLString },
            totalDuration: { type: GraphQLInt },
          }
        }),
        args: {
          timerId: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: async (_, { timerId }, context) => {
          const timers = Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' });
          const timer = await timers.restart({
            timerId,
            email: context.email,
          });
          if(timer.status == true) {
            return { 
              id: timer.data.id,
              startsAt: timer.data.starts_at,
              totalDuration: timer.data.total_duration,
            };
          }
          return {};
        },
      },
    },
  }),
});

export { schema }