const dotenv =  require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const { Client, fetchExchange } = require('@urql/core');
const { DateTime } =  require('luxon');

dotenv.config();

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

const GraphQLClient = new Client({
  url: process.env.DIRECTUS_API_URL,
  exchanges: [fetchExchange],
  fetchOptions: () => {
    const token = process.env.DIRECTUS_API_TOKEN;
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
});

app.post('/timers/update/total-duration', async function (req, res, next) {
  let timerId = 0;
  if(Array.isArray(req.body.keys) && req.body.keys.length > 0) {
    timerId = req.body.keys[0];
  }
  else {
    timerId = req.body.keys;
  }
  const TimersQuery = `
  query timers_by_id($timerId: ID!) {
    timers_by_id(id: $timerId) {
      id
      starts_at
      ends_at
      duration
      total_duration
    }
  }
  `;
  const queryResponse = await GraphQLClient.query(TimersQuery, { timerId });
  if(queryResponse.data != undefined && queryResponse.data.timers_by_id != undefined) {
    // Calculate totalDuration
    const startsAt = DateTime.fromISO(queryResponse.data.timers_by_id.starts_at);
    const endsAt = DateTime.fromISO(queryResponse.data.timers_by_id.ends_at);
    const duration = endsAt.diff(startsAt, 'minutes');
    const { minutes: durationInMinutes } = duration.toObject();
    const totalDuration = Math.ceil(durationInMinutes + queryResponse.data.timers_by_id.duration);
      // Update totalDuration
    if(queryResponse.data.timers_by_id.total_duration !== totalDuration) {
      const TimersMutation = `
      mutation ppdate_timers_item($timerId: ID!, $totalDuration: Int!) {
        update_timers_item(id: $timerId, data: {total_duration: $totalDuration}) {
          id
          total_duration
        }
      }
      `;
      const mutationResponse = await GraphQLClient.mutation(TimersMutation, { timerId, totalDuration });
      // Return payload
      res.json({ok: true, data: mutationResponse.data.update_timers_item});
    }
    else {
      res.log.info(`Timer id: ${queryResponse.data.timers_by_id.id} total duration already updated.`);
      res.status(403).send({error: `Timer id: ${queryResponse.data.timers_by_id.id} total duration already updated.`});
    }
  }
  else {
    res.log.info(`No timer entry was found for timerId ${timerId}`);
    res.status(404).send({error: `No timer entry was found for timerId ${timerId}`});
  }
});

(async () => {
  app.listen(4000);
  logger.info('Happy Path hooks are running 👊');
})();
