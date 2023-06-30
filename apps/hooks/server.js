const express = require('express');
const bodyParser = require('body-parser');

const { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt } = require('graphql');
const { createHandler } = require('graphql-http/lib/use/express');

const { calculateTotalDuration, calculateTotalDurationRegularly, notifyUsersWithAbsentTimers, notifyUsersWithProlongedTimers } = require('./src/routes.js');

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
const pinoHttp = require('pino-http')(loggerOptions);
const logger = require('pino')(loggerOptions);

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(token == undefined || token == null) return res.sendStatus(401);
  if(token != process.env.ACCESS_TOKEN) return res.sendStatus(403);
  next();
}

app.use(pinoHttp);
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
          start: { type: new GraphQLNonNull(GraphQLString) },
          end: { type: new GraphQLNonNull(GraphQLString) },
        },
        type: new GraphQLList(new GraphQLObjectType({
          name: 'Timers',
          fields: {
            id: { type: GraphQLString }
          }
        })),
        resolve: (_, { name }) => {
          return [{id: 'Deneme'}];
        },
      },
      projects: {
        type: new GraphQLList(new GraphQLObjectType({
          name: 'Projects',
          fields: {
            id: { type: GraphQLString }
          }
        })),
        resolve: (_, { name }) => {
          return [{id: 'Deneme'}];
        },
      },
      tasks: {
        type: new GraphQLList(new GraphQLObjectType({
          name: 'Tasks',
          fields: {
            id: { type: GraphQLString }
          }
        })),
        args: {
          projectId: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: (_, { name }) => {
          return [{id: 'Deneme'}];
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
