import YAML from 'yaml';
import { DateTime } from 'luxon';
import { GraphQLClient } from '@happy-path/graphql-client';
import { calculateTotalCost, calculateDuration, metadata as parseMetadata } from '@happy-path/calculator';

const calculate = async (req, res, next) => {
  // Find timerId
  let timerId = undefined;
  if(req.body.data.event == 'timers.items.create') { timerId = req.body.data.key; }
  else if(req.body.data.event == 'timers.items.update') { timerId = req.body.data.keys[0]; }
  else {
    res.log.debug(req.body);
    res.status(403).send({error: `Requested hook type doesn't exist. Exiting.`});
  }
  if(timerId != undefined) {
    // TODO: should use timers.get
    const queryResponse = await GraphQLClient.query(TimersQuery, { timerId });
    if(queryResponse.data != undefined && queryResponse.data.timers_by_id != undefined) {
      const { totalDuration, totalDurationInHours } = calculateDuration({ 
        startsAt: queryResponse.data.timers_by_id.starts_at, 
        endsAt: queryResponse.data.timers_by_id.ends_at,
        duration: queryResponse.data.timers_by_id.duration
      });
      let totalCost = 0, defaultMetadataString = '';
      if(queryResponse.data.timers_by_id.task?.projects_id?.metadata != undefined && req.body?.metadata[0]?.metadata != undefined) {
        const metadata = parseMetadata([req.body.metadata[0].metadata, queryResponse.data.timers_by_id.task.projects_id.metadata]);
        try {
          const totalCost = calculateTotalCost({
            metadata, 
            totalDurationInHours, 
            totalDuration, 
            email: queryResponse.data.timers_by_id.user_id.email, 
            startsAt: queryResponse.data.timers_by_id.starts_at, 
            endsAt: queryResponse.data.timers_by_id.ends_at || DateTime.now()
          });
          if(queryResponse.data.timers_by_id.total_duration !== totalDuration && totalCost != undefined) {
            const mutationResponse = await GraphQLClient.mutation(TimersMutation, { timerId, totalDuration, totalDurationInHours, totalCost });
            if(mutationResponse.error == undefined) {
              res.json({ok: true, data: mutationResponse.data.update_timers_item});
            }
            else {
              res.log.error(mutationResponse.error);
              res.json({ok: false, error: mutationResponse.error}); 
            }
          }
          else {
            res.log.info(`Timer id: ${queryResponse.data.timers_by_id.id} total duration already updated.`);
            res.status(403).send({error: `Timer id: ${queryResponse.data.timers_by_id.id} total duration already updated.`});
          }
        }
        catch(e) {
          res.log.error(e);
        }
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
}

const TimersQuery = `
  query timers_by_id($timerId: ID!) {
    timers_by_id(id: $timerId) {
      id
      starts_at
      ends_at
      duration
      total_duration
      task {
        tasks_id {
          task_name
          id
        }
        projects_id {
          id
          project_name
          metadata
        }
      }
      user_id {
        email
      }
    }
  }
`;

const TimersMutation = `
  mutation update_timers_item($timerId: ID!, $totalDuration: Int!, $totalDurationInHours: Float!, $totalCost: Float!) {
    update_timers_item(id: $timerId, data: {total_duration: $totalDuration, total_duration_in_hours: $totalDurationInHours, total_cost: $totalCost}) {
      id
      total_duration
      total_duration_in_hours
      total_cost
    }
  }
`;

export { calculate }