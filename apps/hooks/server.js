const express = require('express');
const bodyParser = require('body-parser');
const { calculateTotalDuration, calculateTotalDurationRegularly, notifyUsersWithAbsentTimers } = require('./src/routes.js');

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

(async () => {
  app.listen(process.env.PORT || 4000);
  logger.info('Happy Path hooks are running 👊');
})();
