const dotenv =  require('dotenv');
const YAML = require('yaml');
const { Client, fetchExchange } = require('@urql/core');
const { DateTime } =  require('luxon');
const priceModifiers = require('./Price/Modifiers.js');

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
// TODO: import statements
// TODO: İki farklı hook'a bölmek?
// FIXME: arada #totalCost not null hatası veriyor

const calculateTotalDuration = async (req, res, next) => {
  // Find timerId
  let timerId = undefined;
  if(req.body.data.event == 'timers.items.create') { timerId = req.body.data.key; }
  else if(req.body.data.event == 'timers.items.update') { timerId = req.body.data.keys[0]; }
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
      let startsAt, endsAt;
      let totalDuration = queryResponse?.data?.timers_by_id?.total_duration;
      if(queryResponse.data.timers_by_id.starts_at && queryResponse.data.timers_by_id.ends_at) {
        startsAt = DateTime.fromISO(queryResponse.data.timers_by_id.starts_at);
        endsAt = DateTime.fromISO(queryResponse.data.timers_by_id.ends_at);
        if(totalDuration == undefined || totalDuration == 0) {
          const duration = endsAt.diff(startsAt, 'minutes');
          const { minutes: durationInMinutes } = duration.toObject();
          totalDuration = Math.floor(durationInMinutes + queryResponse.data.timers_by_id.duration);
        }
        else {
          totalDuration = +queryResponse.data.timers_by_id.duration;
        }
      }
      const totalDurationInHours = +((totalDuration / 60).toFixed(2));
      // Calculate totalCost
      let totalCost = 0, defaultMetadataString = '';
      if(queryResponse.data.timers_by_id.task?.projects_id?.metadata != undefined && req.body?.metadata[0]?.metadata != undefined) {
        defaultMetadataString += req.body.metadata[0].metadata.trim();
        defaultMetadataString += '\n';
        defaultMetadataString += queryResponse.data.timers_by_id.task.projects_id.metadata;
        try {
          const totalCost = calculateTotalCost({metadata: defaultMetadataString, totalDurationInHours, totalDuration, userId: queryResponse.data.timers_by_id.user_id.id, startsAt, endsAt: DateTime.now()});
          // Update totalDuration+totalCost
          if(queryResponse.data.timers_by_id.total_duration !== totalDuration && totalCost != undefined) {
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

// TODO: sadece güncelleme varsa edit'lemeli
const calculateTotalDurationRegularly = async (req, res, next) => {
  if(req.body.metadata != undefined && req.body.data != undefined && typeof req.body.data == 'object') {
    req.body.data.forEach(async (item) => {
      let defaultMetadataString = '';
      const startsAt = DateTime.fromISO(item.starts_at);
      const { minutes: durationInMinutes } = DateTime.now().diff(startsAt, 'minutes').toObject();
      const totalDuration = Math.floor(durationInMinutes + item.duration);
      const totalDurationInHours = +((totalDuration / 60).toFixed(2));
      const {status: metadataStatus, data: projectData } = await fetchProjectByTaskId(item.task);
      if(metadataStatus === true) {
        defaultMetadataString += req.body.metadata[0].metadata.trim();
        defaultMetadataString += '\n';
        defaultMetadataString += projectData.metadata;
        try {
          const totalCost = calculateTotalCost({metadata: defaultMetadataString, totalDurationInHours, totalDuration, userId: item.user_id, startsAt, endsAt: DateTime.now()});
          if(totalCost != undefined) {
            const mutationResponse = await GraphQLClient.mutation(TimersMutation, { timerId: item.id, totalDuration, totalDurationInHours, totalCost });
            if(mutationResponse.error != undefined) {
              res.log.error(mutationResponse.error);
            }
          }
          else {
            res.log.debug(totalCost);
          }
        }
        catch(e) {
          res.log.error(e);
        }
      }
      else {
        res.log.debug(projectData);
      }
    });
    res.json({ok: true});
  }
  else {
    res.log.debug(req.body);
    res.status(403).send({error: `Requested data and metadata are missing. Exiting.`});
  }
}

const calculateTotalCost = (params) => {
  const { userId, totalDurationInHours, totalDuration, startsAt, endsAt, metadata: defaultMetadataString } = params;
  const metadata = YAML.parse(defaultMetadataString);
  const matchedGroup = metadata?.groups?.filter(group => {
    const { members } = group[Object.keys(group)[0]];
    return members.some(member => member === userId);
  });
  let matchedGroupName, totalCost = 0;
  if(matchedGroup?.length > 0) {
    matchedGroupName = Object.keys(matchedGroup[0])[0];
    const matchedPrice = metadata?.prices?.filter(price => {
      const { groups, valid_until: validUntil } = price;
      return (groups.some(group => group === matchedGroupName) && DateTime.now() <= DateTime.fromISO(validUntil));
    });
    if(matchedPrice != undefined && matchedPrice?.length > 0) {
      const priceModifiersToApply = (metadata.price_modifiers !== undefined && typeof metadata.price_modifiers === 'object') ? Object.values(metadata.price_modifiers) : [];
      const availablePriceModifiersToApply = Object.entries(priceModifiers)
        .filter(([methodName, method]) => typeof method === 'function' && priceModifiersToApply.includes(methodName))
        .map(([methodName, method]) => method);
      const price = availablePriceModifiersToApply.reduce((acc, func) => func(acc, totalDuration, startsAt, endsAt), matchedPrice[0]?.price);
      totalCost = +((price * totalDurationInHours).toFixed(2));
    }
  }
  return totalCost;
}

// TODO: Project entity'si içine taşınmalı
const fetchProjectByTaskId = async (projectTaskId) => {
  const ProjectMetadataQuery = `
    query projects_tasks_by_id($projectTaskId: ID!) {
      projects_tasks_by_id(id: $projectTaskId) {
        projects_id {
          metadata
        }
      }
    }
  `;
  const queryResponse = await GraphQLClient.query(ProjectMetadataQuery, { projectTaskId });
  if(queryResponse?.data?.projects_tasks_by_id.projects_id != undefined && typeof queryResponse.data.projects_tasks_by_id.projects_id == 'object') {
    return { status: true, data: queryResponse.data.projects_tasks_by_id.projects_id }
  }
  else {
    throw new Error(queryResponse.error);
  }
  return { status: false }
}

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

module.exports = { calculateTotalDuration, calculateTotalDurationRegularly }