import dotenv from 'dotenv';
import { DateTime, Duration } from 'luxon';
import { Backend as GraphQLClient } from '@happy-path/graphql-client';
import { Timers, Projects } from '@happy-path/graphql-entities';
import { calculateTotalCost, metadata as parseMetadata } from '@happy-path/calculator';

dotenv.config();

const calculate =  async (req, res, next) => {
  // TODO: This is buggy, when there are too many records it fails to update some of the records, multiple triggers are required.
  const { collection, keys: projectIds } = req.body.data.body;
  const [ { metadata: metadataTemplate } ] = req.body.metadata;
  if(projectIds.length > (process.env.REPORTS_MAX_NUMBER_OF_PROJECTS_TO_PROCESS || 12)) throw new Error(`Max number of projects exceeded.`);
  if(metadataTemplate == undefined) throw new Error(`Metadata is missing.`);
  if(collection != 'projects') throw new Error(`Can process only for "projects".`);
  await Promise.all(
    projectIds.map(async (projectId) => {
      const { metadata: projectMetadata, created_at: projectCreatedAt } = await Projects({ client: GraphQLClient() }).findProjectById({ projectId });
      const metadata = parseMetadata([metadataTemplate, projectMetadata]);
      const timers = await Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' }).findTimersByProjectId({ 
        projectId,
        startsAt: projectCreatedAt,
        endsAt: DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).toISO(),
      });
      await Promise.all(
        timers.map(async (item) => {
          try {
            const totalCost = calculateTotalCost({
              metadata, 
              totalDurationInHours: item.total_duration_in_hours,
              totalDuration: item.total_duration, 
              email: item.user_id.email, 
              startsAt: DateTime.fromISO(item.starts_at), 
              endsAt: DateTime.fromISO(item.ends_at)
            });
            if(totalCost != undefined && totalCost != null && totalCost != item.total_cost) {
              setTimeout(
                async () => await Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' }).update({ timerId: item.id, data: { 
                  totalCost,
                  totalDurationInHours: item.total_duration_in_hours,
                  totalDuration: item.total_duration,  
                  duration: item.duration
                }}), 
                process.env.DEBOUNCE_CONCURRENT_REQUESTS || 500
                );
            }
            else {
              res.log.debug(`Total cost is undefined or no need to update for timer ID: ${item.id}`);
            }
          }
          catch(e) {
            res.log.error(e);
          }
        })
      );
    })
  );
  res.json({ ok: true });
}

export { calculate }
