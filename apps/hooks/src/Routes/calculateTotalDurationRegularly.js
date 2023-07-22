import YAML from 'yaml';
import { DateTime } from 'luxon';
import { GraphQLClient as graphqlClient } from '@happy-path/graphql-client';
import { Timers } from '@happy-path/graphql-entities';
import { calculateTotalCost, calculateDuration, metadata as parseMetadata } from '@happy-path/calculator';

const calculate = async (req, res, next) => {
  // TODO: Should update only if there are changed values
  if(req.body.metadata != undefined) {
    const timers = await Timers({ graphqlClient }).findTimersByNoEndDate({ startsBefore: DateTime.now().toISO() }); 
    if(timers.length == 0) res.status(404).send({error: `No running timers were found. Exiting.`});
    timers.forEach(async (item) => {
      const metadata = parseMetadata([req.body.metadata[0].metadata, item?.task?.projects_id?.metadata]);
      const { totalDuration, totalDurationInHours } = calculateDuration({ startsAt: item.starts_at, duration: item.duration });        
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
          await Timers({ graphqlClient }).update({timerId: item.id, data: { duration: item.duration, totalDuration, totalDurationInHours, totalCost }});
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
    res.log.debug(req.body);
    res.status(403).send({error: `Metadata is missing. Exiting.`});
  }
}

export { calculate }