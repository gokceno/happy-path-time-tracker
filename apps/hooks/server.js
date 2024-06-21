import express from 'express';
import bodyParser from 'body-parser';
import pino from 'pino';
import { jwtVerify } from 'jose';
import pinoHttp from 'pino-http';
import { createHandler } from 'graphql-http/lib/use/express';
import { 
  calculateTotalDuration,
  calculateTotalDurationRegularly,
  calculateProjectTimers,
  notifyUsersWithProlongedTimers,
  notifyUsersWithAbsentTimers,
  createProjectsReport,
  schema,
} from './src/Routes/index.js';

Number.prototype.toCurrency = function (currency) {
  return new Intl.NumberFormat((process.env.LOCALE_CULTURE || 'en-US'), { style: 'currency', currency: (currency || process.env.LOCALE_CURRENCY || 'USD') }).format(this);
}

Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}

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

const authenticateUserByJWT = async (req, res, next) => {
  const [type, token] = (req.headers['authorization'] || '').split(' ');
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const {
    payload: { email },
  } = await jwtVerify(token, secret);
  if(email == undefined) return res.sendStatus(403);
  else {
    next();
  }
}

app.use(pinoHttpLogger);
app.use(bodyParser.json());
app.use(express.json());

// TODO: Must follow the same URL format either verb-noun or noun-verb
app.post('/timers/update/total-duration', authenticateAPI, calculateTotalDuration);
app.post('/timers/update/regularly/total-duration', authenticateAPI, calculateTotalDurationRegularly);
app.post('/notify/users/with/absent/timers', authenticateAPI, notifyUsersWithAbsentTimers);
app.post('/notify/users/with/prolonged/timers', authenticateAPI, notifyUsersWithProlongedTimers);
app.post('/reports/projects/create/month/:month', authenticateAPI, createProjectsReport);
app.post('/calculate/project/timers', authenticateAPI, calculateProjectTimers);

// TODO: Crashes when no token is present
app.all('/graphql', authenticateUserByJWT, createHandler({ 
  schema, 
  context: async (req) => {
    const [type, token] = (req.headers['authorization'] || '').split(' ');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const {
      payload: { email },
    } = await jwtVerify(token, secret);
    return { email };
  } 
}));

(async () => {
  app.listen(4000);
  logger.info('Happy Path hooks are running 👊');
})();
