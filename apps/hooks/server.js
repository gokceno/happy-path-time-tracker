import express from 'express';
import bodyParser from 'body-parser';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { createRequire } from "module";
import { createHandler } from 'graphql-http/lib/use/express';
import { notifyUsersWithProlongedTimers } from './src/Routes/notifyUsersWithProlongedTimers.js';
import { calculateTotalDuration } from './src/Routes/calculateTotalDuration.js';
import { calculateTotalDurationRegularly } from './src/Routes/calculateTotalDurationRegularly.js';
import { notifyUsersWithAbsentTimers } from './src/Routes/notifyUsersWithAbsentTimers.js';
import { create as createProjectsReport } from './src/Routes/createProjectsReport.js';
import { calculate as calculateProjectTimers } from './src/Routes/calculateProjectTimers.js';
import { schema } from './src/Routes/schema.js';

Number.prototype.toCurrency = function () {
  return new Intl.NumberFormat((process.env.LOCALE_CULTURE || 'en-US'), { style: 'currency', currency: (process.env.LOCALE_CURRENCY || 'USD') }).format(this);
}

Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}

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
app.post('/reports/projects/create', authenticateAPI, createProjectsReport);
app.post('/calculate/project/timers', authenticateAPI, calculateProjectTimers);

app.all('/graphql', authenticateUser, createHandler({ 
  schema, 
  context: async (req) => await magic.users.getMetadataByToken(req.headers['authorization'].split(' ')[1]) 
}));

(async () => {
  app.listen(process.env.PORT || 4000);
  logger.info('Happy Path hooks are running 👊');
})();
