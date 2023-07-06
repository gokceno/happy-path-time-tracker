import express from 'express';
import bodyParser from 'body-parser';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { createRequire } from "module";
import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt, GraphQLInputObjectType } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import { calculateTotalDuration, calculateTotalDurationRegularly, notifyUsersWithAbsentTimers, notifyUsersWithProlongedTimers } from './src/routes.js';
import { Projects, Tasks, Timers } from '@happy-path/graphql-entities';
import { GraphQLClient as graphqlClient } from '@happy-path/graphql-client';

// Apply some hacks & init Magic
const require = createRequire(import.meta.url);
const { Magic } = require('@magic-sdk/admin');
const magic = new Magic(process.env.MAGIC_SECRET_KEY);

// Init Express
const app = express();

// Set up logging
const loggerOptions = {
  level: process.env.LOGLEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  },
};

const logger = pino(loggerOptions);
const pinoHttpLogger = pinoHttp(loggerOptions);

const authenticateAPI = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(token == undefined || token == null) return res.sendStatus(401);
  if(token != process.env.ACCESS_TOKEN) return res.sendStatus(403);
  next();
}

const authenticateUser = async (req, res, next) => {
  try {
    magic.token.validate(req.headers['authorization'].split(' ')[1]);
  }
  catch(e) {
    res.log.debug(e);
    return res.sendStatus(403);
  }
  next();
}

app.use(pinoHttpLogger);
app.use(bodyParser.json());
app.use(express.json());

app.post('/timers/update/total-duration', authenticateAPI, calculateTotalDuration);
app.post('/timers/update/regularly/total-duration', authenticateAPI, calculateTotalDurationRegularly);
app.post('/notify/users/with/absent/timers', authenticateAPI, notifyUsersWithAbsentTimers);
app.post('/notify/users/with/prolonged/timers', authenticateAPI, notifyUsersWithProlongedTimers);

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      me: {
        type: new GraphQLObjectType({
          name: 'Me',
          fields: {
            did: { type: GraphQLString },
            email: { type: GraphQLString }
          }
        }),
        resolve: async (_, { name }, context) => {
          return {
            did: context.issuer,
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
          const timers = Timers({ graphqlClient });
          return (await timers.list({ startsAt, endsAt, email: context.email })).map(item => ({ 
            id: item.id, 
            startsAt: item.starts_at,
            endsAt: item.ends_at,
            duration: item.duration,
            totalDuration: item.total_duration,
            notes: item.notes,
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
          const projects = Projects({ graphqlClient });
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
          const tasks = Tasks({ graphqlClient, queryParams: { projectId } });
          return (await tasks.list()).map(item => ({ id: item.id, taskName: item.tasks_id.task_name }));
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
            id: { type: GraphQLString }
          }
        }),
        args: {
          projectTaskId: { type: new GraphQLNonNull(GraphQLInt) },
          duration: { type: GraphQLInt },
          notes: { type: GraphQLString }
        },
        resolve: async (_, { projectTaskId, startsAt, duration, notes }, context) => {
          const timers = Timers({ graphqlClient });
          const timer = await timers.start({
            projectTaskId,
            email: context.email,
            duration,
            taskComment: notes
          });
          if(timer.status == true) {
            return { id: timer.data.id };
          }
        },
      },
      stop: {
        type: new GraphQLObjectType({
          name: 'Stop',
          fields: {
            totalDuration: { type: GraphQLInt }
          }
        }),
        args: {
          timerId: { type: new GraphQLNonNull(GraphQLInt) },
        },
        resolve: async (_, { timerId }, context) => {
          const timers = Timers({ graphqlClient });
          const timer = await timers.stop({ timerId, email: context.email });          
          if(timer.status == true) {
            return { totalDuration: timer.data.total_duration };
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
            id: { type: GraphQLString }
          }
        }),
        args: {
          projectTaskId: { type: new GraphQLNonNull(GraphQLInt) },
          duration: { type: GraphQLInt },
          notes: { type: GraphQLString },
          startsAt: { type: GraphQLString },
          endsAt: { type: GraphQLString }
        },
        resolve: async (_, { projectTaskId, duration, notes, startsAt, endsAt }, context) => {
          const timers = Timers({ graphqlClient });
          const timer = await timers.log({
            projectTaskId,
            email: context.email,
            duration,
            taskComment: notes,
            startsAt,
            endsAt
          });
          if(timer.status == true) {
            return { id: timer.data.id };
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
          const timers = Timers({ graphqlClient });
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
            id: { type: GraphQLInt }
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
              notes: { type: GraphQLString }
            }
          })}
        },
        resolve: async (_, { timerId, input }, context) => {
          const timers = Timers({ graphqlClient });
          const timer = await timers.update({ timerId, data: {
            duration: input?.duration,
            startsAt: input?.startsAt,
            endsAt: input?.endsAt,
            taskComment: input?.notes
          }});
          if(timer.status == true) {
            return { id: timer.data.id };
          }
        },
      },
    },
  }),
});

app.all('/graphql', authenticateUser, createHandler({ 
  schema, 
  context: async (req) => await magic.users.getMetadataByToken(req.headers['authorization'].split(' ')[1]) 
}));


(async () => {
  app.listen(process.env.PORT || 4000);
  logger.info('Happy Path hooks are running 👊');
})();
