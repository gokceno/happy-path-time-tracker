import express from 'express';
import bodyParser from 'body-parser';
import pino from 'pino';
import jwt from 'jsonwebtoken';
import pinoHttp from 'pino-http';
import { createRequire } from "module";
import { createHandler } from 'graphql-http/lib/use/express';
import { 
  calculateTotalDuration,
  calculateTotalDurationRegularly,
  calculateProjectTimers,
  notifyUsersWithProlongedTimers,
  notifyUsersWithAbsentTimers,
  createProjectsReport,
  schema,
  token
} from './src/Routes/index.js';

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

// Init JWT
const { verify } = jwt;

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

const authenticateUserByMagic = async (req, res, next) => {
  try {
    const [type, token] = (req.headers['authorization'] || '').split(' ');
    magic.token.validate(token);
  }
  catch(e) {
    return res.sendStatus(403);
  }
  next();
}

const authenticateUserByJWT = async (req, res, next) => {
  const [type, token] = (req.headers['authorization'] || '').split(' ');
  jwt.verify(token, process.env.JWT_SECRET || '', (err, decoded) => {
    if(decoded == undefined) return res.sendStatus(403);
    else {
      next();
    }
  });
}

app.use(pinoHttpLogger);
app.use(bodyParser.json());
app.use(express.json());

// TODO: Must follow the same URL format either verb-noun or noun-verb
app.post('/timers/update/total-duration', authenticateAPI, calculateTotalDuration);
app.post('/timers/update/regularly/total-duration', authenticateAPI, calculateTotalDurationRegularly);
app.post('/notify/users/with/absent/timers', authenticateAPI, notifyUsersWithAbsentTimers);
app.post('/notify/users/with/prolonged/timers', authenticateAPI, notifyUsersWithProlongedTimers);
app.post('/reports/projects/create', authenticateAPI, createProjectsReport);
app.post('/calculate/project/timers', authenticateAPI, calculateProjectTimers);
app.post('/token', authenticateUserByMagic, token);

// TODO: Crashes when no token is present
app.all('/graphql', authenticateUserByJWT, createHandler({ 
  schema, 
  context: async (req) => {
    const [type, token] = (req.headers['authorization'] || '').split(' ');
    return jwt.verify(token, process.env.JWT_SECRET, (e, decoded) => {
      return decoded;
    });
  } 
}));

(async () => {
  app.listen(4000);
  logger.info('Happy Path hooks are running 👊');
})();
