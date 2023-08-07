import YAML from 'yaml';
import { DateTime } from 'luxon';
import { Backend as GraphQLClient } from '@happy-path/graphql-client';
import { Timers } from '@happy-path/graphql-entities';
import { calculateTotalCost, calculateDuration, metadata as parseMetadata } from '@happy-path/calculator';

const calculate = async (req, res, next) => {
  // TODO: Should update only if there are changed values
  const timers = await Timers({ client: GraphQLClient() }).findTimersByNoEndDate({ startsBefore: DateTime.now().toISO() }); 
  if(timers.length > 0) {
    await Promise.all(
      timers.map(async (item) => {
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
            await Timers({ client: GraphQLClient() }).update({timerId: item.id, data: { duration: item.duration, totalDuration, totalDurationInHours, totalCost }});
          }
          else {
            res.log.debug(`Total cost is undefined for timer ID: ${item.id}`);
          }
        }
        catch(e) {
          res.log.error(e);
        }
      })
    );
    res.json({ok: true});
  }
  else {
    res.status(404).send({error: `No running timers were found. Exiting.`})
  }
}

export { calculate }