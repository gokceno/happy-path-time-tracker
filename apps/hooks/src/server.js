const express = require('express');
const bodyParser = require('body-parser');

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

app.post('/register', async function (req, res, next) {
  res.json({ok: true});
  res.log.info(`All good! ${req.body.keys[0]}`);
});

(async () => {
  app.listen(4000);
  logger.info('Running 👊');
})();
