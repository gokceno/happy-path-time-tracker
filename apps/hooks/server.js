const express = require('express');
const bodyParser = require('body-parser');
const { calculateTotalDuration, calculateTotalDurationRegularly } = require('./src/routes.js');

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

app.use(pinoHttp);
app.use(bodyParser.json());
app.use(express.json());

app.post('/timers/update/total-duration', calculateTotalDuration);
app.post('/timers/update/regularly/total-duration', calculateTotalDurationRegularly);

(async () => {
  app.listen(process.env.PORT || 4000);
  logger.info('Happy Path hooks are running 👊');
})();
