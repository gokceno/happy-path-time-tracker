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
  // Find timerId
  let timerId = undefined;
  if(req.body.event == 'timers.items.create') { timerId = req.body.key; }
  else if(req.body.event == 'timers.items.update') { timerId = req.body.keys[0]; }
  else {
    res.log.debug(req.body);
    res.status(403).send({error: `Requested hook type doesn't exist. Exiting.`});
  }
  if(timerId != undefined) {
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
      let totalDuration = 0;
      let totalDurationInHours = 0;
      if(queryResponse.data.timers_by_id.starts_at && queryResponse.data.timers_by_id.ends_at) {
        const startsAt = DateTime.fromISO(queryResponse.data.timers_by_id.starts_at);
        const endsAt = DateTime.fromISO(queryResponse.data.timers_by_id.ends_at);
        const duration = endsAt.diff(startsAt, 'minutes');
        const { minutes: durationInMinutes } = duration.toObject();
        totalDuration = Math.ceil(durationInMinutes + queryResponse.data.timers_by_id.duration);
        totalDurationInHours = totalDuration / 60;
      }
      else {
        totalDuration = +queryResponse.data.timers_by_id.duration;
        totalDurationInHours = totalDuration / 60;
      }
      // Update totalDuration
      if(queryResponse.data.timers_by_id.total_duration !== totalDuration) {
        const TimersMutation = `
        mutation update_timers_item($timerId: ID!, $totalDuration: Int!, $totalDurationInHours: Float!) {
          update_timers_item(id: $timerId, data: {total_duration: $totalDuration, total_duration_in_hours: $totalDurationInHours}) {
            id
            total_duration
            total_duration_in_hours
          }
        }
        `;
        const mutationResponse = await GraphQLClient.mutation(TimersMutation, { timerId, totalDuration, totalDurationInHours });
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
  }
  else {
    res.log.debug(req.body);
    res.status(412).send({error: `timerId is not present. Exiting.`});
  }
});

(async () => {
  app.listen(4000);
  logger.info('Happy Path hooks are running 👊');
})();
