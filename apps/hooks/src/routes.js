const dotenv =  require('dotenv');
const YAML = require('yaml');
const { Client, fetchExchange } = require('@urql/core');
const { DateTime } =  require('luxon');

dotenv.config();

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

// TODO: Billable olmayan task tipleri?
// TODO: Bozuk YAML'lar tüm process'i patlatıyor
// TODO: import statements
// TODO: İki farklı hook'a bölmek?
const calculateTotalDuration = async function (req, res, next) {
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
                  id
              }
          }
      }
    `;
    const queryResponse = await GraphQLClient.query(TimersQuery, { timerId });
    if(queryResponse.data != undefined && queryResponse.data.timers_by_id != undefined) {
      // Calculate totalDuration
      let totalDuration = 0;
      if(queryResponse.data.timers_by_id.starts_at && queryResponse.data.timers_by_id.ends_at) {
        const startsAt = DateTime.fromISO(queryResponse.data.timers_by_id.starts_at);
        const endsAt = DateTime.fromISO(queryResponse.data.timers_by_id.ends_at);
        const duration = endsAt.diff(startsAt, 'minutes');
        const { minutes: durationInMinutes } = duration.toObject();
        totalDuration = Math.floor(durationInMinutes + queryResponse.data.timers_by_id.duration);
      }
      else {
        totalDuration = +queryResponse.data.timers_by_id.duration;
      }
      const totalDurationInHours = +((totalDuration / 60).toFixed(2));
      // Calculate totalCost
      let totalCost = 0, defaultMetadataString = '';
      if(queryResponse.data.timers_by_id.task?.projects_id?.metadata != undefined) {
        const {status: metadataStatus, data: defaultMetadata } = await fetchDefaultMetadata();
        if(metadataStatus === true) {
          defaultMetadataString += defaultMetadata.trim();
          defaultMetadataString += '\n';
        }
        defaultMetadataString += queryResponse.data.timers_by_id.task.projects_id.metadata;
        const metadata = YAML.parse(defaultMetadataString)
        const matchedGroup = metadata?.groups?.filter(group => {
          const { members } = group[Object.keys(group)[0]];
          return members.some(member => member === queryResponse.data.timers_by_id.user_id.id);
        });
        let matchedGroupName;
        if(matchedGroup?.length > 0) {
          matchedGroupName = Object.keys(matchedGroup[0])[0];
          const matchedPrice = metadata?.prices?.filter(price => {
            const { groups, valid_until: validUntil } = price[Object.keys(price)[0]];
            return (groups.some(group => group === matchedGroupName) && DateTime.now() <= DateTime.fromISO(validUntil));
          });
          if(matchedPrice != undefined && matchedPrice?.length > 0) {
            const price = matchedPrice[0]?.[Object.keys(matchedPrice[0])[0]]?.price;
            totalCost = +((price * totalDurationInHours).toFixed(2));
          }
        }
      }
      // Update totalDuration+totalCost
      if(queryResponse.data.timers_by_id.total_duration !== totalDuration) {
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
        const mutationResponse = await GraphQLClient.mutation(TimersMutation, { timerId, totalDuration, totalDurationInHours, totalCost });
        // Return payload
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

const fetchDefaultMetadata = async function() {
  const MetadataQuery = `
    query metadata {
      metadata {
        metadata
      }
    }
  `;
  const queryResponse = await GraphQLClient.query(MetadataQuery);
  if(queryResponse?.data?.metadata != undefined) {
    return {status: true, data: queryResponse.data.metadata.metadata }
  }
  else {
    throw new Error(queryResponse.error);
  }
  return { status: false }
}

module.exports = { calculateTotalDuration }