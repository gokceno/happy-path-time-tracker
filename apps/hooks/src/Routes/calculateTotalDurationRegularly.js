import YAML from 'yaml';
import { DateTime } from 'luxon';
import { GraphQLClient } from '@happy-path/graphql-client';
import { calculateTotalCost, calculateDuration, metadata as parseMetadata } from '../calculate.js';

const calculate = async (req, res, next) => {
  // TODO: Should update only if there are changed values
  if(req.body.metadata != undefined) {
    const queryResponse = await GraphQLClient.query(TimersWithNoEndDateQuery);
    if(queryResponse?.data?.timers != undefined && queryResponse?.data?.timers.length > 0) {
      queryResponse.data.timers.forEach(async (item) => {
        const metadata = parseMetadata([req.body.metadata[0].metadata, item?.task?.projects_id?.metadata]);
        const { totalDuration, totalDurationInHours } = calculateDuration({ startsAt: item.starts_at, duration: item.duration});        
        try {
          const totalCost = calculateTotalCost({
            metadata, 
            totalDurationInHours, 
            totalDuration, 
            email: item.user_id.email, 
            startsAt: item.starts_at, 
            endsAt: DateTime.now()
          });
          if(totalCost != undefined) {
            const mutationResponse = await GraphQLClient.mutation(TimersMutation, { timerId: item.id, totalDuration, totalDurationInHours, totalCost });
            if(mutationResponse.error != undefined) {
              res.log.error(mutationResponse.error);
            }
          }
          else {
            res.log.debug(`Total cost is undefined for timer ID: ${item.id}`);
          }
        }
        catch(e) {
          res.log.error(e);
        }
      });
      res.json({ok: true});
    }
    else {
      res.status(404).send({error: `No running timers were found. Exiting.`});
    }
  }
  else {
    res.log.debug(req.body);
    res.status(403).send({error: `Metadata is missing. Exiting.`});
  }
}

const TimersWithNoEndDateQuery = `
  query Timers {
    timers(filter: {ends_at: {_null: null}}) {
      id
      user_id {
        email
      }
      duration
      starts_at
      task {
        projects_id {
          metadata
        }
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