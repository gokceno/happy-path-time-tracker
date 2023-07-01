import express from 'express';
import bodyParser from 'body-parser';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import { calculateTotalDuration, calculateTotalDurationRegularly, notifyUsersWithAbsentTimers, notifyUsersWithProlongedTimers } from './src/routes.js';
import { Projects, Tasks, Timers } from '@happy-path/graphql-entities';
import { GraphQLClient as graphqlClient } from '@happy-path/graphql-client';

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

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(token == undefined || token == null) return res.sendStatus(401);
  if(token != process.env.ACCESS_TOKEN) return res.sendStatus(403);
  next();
}

app.use(pinoHttpLogger);
app.use(bodyParser.json());
app.use(express.json());
app.use(authenticate);

app.post('/timers/update/total-duration', calculateTotalDuration);
app.post('/timers/update/regularly/total-duration', calculateTotalDurationRegularly);
app.post('/notify/users/with/absent/timers', notifyUsersWithAbsentTimers);
app.post('/notify/users/with/prolonged/timers', notifyUsersWithProlongedTimers);

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      timers: {
        args: {
          startsAt: { type: new GraphQLNonNull(GraphQLString) },
          endsAt: { type: new GraphQLNonNull(GraphQLString) },
          externalUserId: { type: new GraphQLNonNull(GraphQLString) },
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
        resolve: async (_, { startsAt, endsAt, externalUserId }) => {
          const timers = Timers({ graphqlClient });
          return (await timers.list({ startsAt, endsAt, externalUserId })).map(item => ({ 
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
        resolve: async (_, { name }) => {
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
        resolve: async (_, { projectId }) => {
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
        type: new GraphQLList(new GraphQLObjectType({
          name: 'Start',
          fields: {
            id: { type: GraphQLString }
          }
        })),
        args: {
          start: { type: new GraphQLNonNull(GraphQLString) },
          end: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: (_, { name }) => {
          return [{id: 'Deneme'}];
        },
      },
      stop: {
        type: new GraphQLList(new GraphQLObjectType({
          name: 'Stop',
          fields: {
            id: { type: GraphQLString }
          }
        })),
        args: {
          start: { type: new GraphQLNonNull(GraphQLString) },
          end: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: (_, { name }) => {
          return [{id: 'Deneme'}];
        },
      },
      log: {
        type: new GraphQLList(new GraphQLObjectType({
          name: 'Log',
          fields: {
            id: { type: GraphQLString }
          }
        })),
        args: {
          start: { type: new GraphQLNonNull(GraphQLString) },
          end: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: (_, { name }) => {
          return [{id: 'Deneme'}];
        },
      },
    },
  }),
});

app.all('/graphql', createHandler({ schema }));


(async () => {
  app.listen(process.env.PORT || 4000);
  logger.info('Happy Path hooks are running 👊');
})();
