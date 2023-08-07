import YAML from 'yaml';
import { DateTime } from 'luxon';
import { Backend as GraphQLClient } from '@happy-path/graphql-client';
import { Timers } from '@happy-path/graphql-entities';
import { calculateTotalCost, calculateDuration, metadata as parseMetadata } from '@happy-path/calculator';

const calculate = async (req, res, next) => {
  let timerId = undefined;
  if(req.body.data.event == 'timers.items.create') { timerId = req.body.data.key; }
  else if(req.body.data.event == 'timers.items.update') { timerId = req.body.data.keys[0]; }
  else {
    res.log.debug(req.body);
    res.status(403).send({error: `Requested hook type doesn't exist. Exiting.`});
  }
  if(timerId != undefined) {
    const timer = await Timers({ graphqlClient: GraphQLClient() }).findTimerById({ timerId });
    if(timer != undefined) {
      const { totalDuration, totalDurationInHours } = calculateDuration({ 
        startsAt: timer.starts_at, 
        endsAt: timer.ends_at,
        duration: timer.duration
      });
      let totalCost = 0;
      if(timer.task?.projects_id?.metadata != undefined && req.body?.metadata[0]?.metadata != undefined) {
        const metadata = parseMetadata([req.body.metadata[0].metadata, timer.task.projects_id.metadata]);
        try {
          const totalCost = calculateTotalCost({
            metadata, 
            totalDurationInHours, 
            totalDuration, 
            email: timer.user_id.email, 
            startsAt: timer.starts_at, 
            endsAt: timer.ends_at || DateTime.now()
          });
          if(timer.total_duration != totalDuration && totalCost != undefined) {
            const mutation = await Timers({ graphqlClient: GraphQLClient() }).update({timerId, data: { duration: timer.duration, totalDuration, totalDurationInHours, totalCost }});
            res.json({ ok: true, data: mutation.data });
          }
          else {
            res.log.info(`Timer id: ${timer.id} total duration already updated.`);
            res.status(403).send({error: `Timer id: ${timer.id} total duration already updated.`});
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

export { calculate }