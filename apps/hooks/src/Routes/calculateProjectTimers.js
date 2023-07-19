import dotenv from 'dotenv';
import { DateTime, Duration } from 'luxon';
import { GraphQLClient as graphqlClient } from '@happy-path/graphql-client';
import { Timers, Projects } from '@happy-path/graphql-entities';
import { calculateTotalCost } from '../calculateTotalCost.js';

dotenv.config();

const calculate =  async (req, res, next) => {
  // TODO: This is buggy, when there are too many records it fails to update some of the records, multiple triggers are required.
  const { collection, keys: projectIds } = req.body.data.body;
  const [ { metadata: metadataTemplate } ] = req.body.metadata;
  if(projectIds.length > (process.env.REPORTS_MAX_NUMBER_OF_PROJECTS_TO_PROCESS || 12)) throw new Error(`Max number of projects exceeded.`);
  if(metadataTemplate == undefined) throw new Error(`Metadata is missing.`);
  if(collection != 'projects') throw new Error(`Can process only for "projects".`);
  projectIds.forEach(async (projectId) => {
    const { metadata: projectMetadata, created_at: projectCreatedAt } = await Projects({ graphqlClient }).findProjectById({ projectId });
    const metadata = metadataTemplate.trim() + '\n' + projectMetadata.trim();
    const timers = await Timers({ graphqlClient }).findTimersByProjectId({ 
      projectId,
      startsAt: projectCreatedAt,
      endsAt: DateTime.now().toISO(),
    });
    timers.forEach(async (item) => {
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
            setTimeout(async () => {
              const mutation = await graphqlClient.mutation(TimersMutation, { 
                timerId: item.id, 
                totalCost 
              });
              if(mutation.error != undefined) res.log.error(mutation.error);
            }, (process.env.DEBOUNCE_CONCURRENT_REQUESTS || 500));
          }
          else {
            res.log.debug(`Total cost is undefined or no need to update for timer ID: ${item.id}`);
          }
        }
        catch(e) {
          res.log.error(e);
        }
    });
  })
  res.json({ ok: true });
}

const TimersMutation = `
  mutation update_timers_item($timerId: ID!, $totalCost: Float!) {
    update_timers_item(id: $timerId, data: {total_cost: $totalCost}) {
      id
      total_cost
    }
  }
`;

export { calculate }
