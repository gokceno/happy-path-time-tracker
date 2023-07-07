import dotenv from 'dotenv';
import bolt from '@slack/bolt';
import YAML from 'yaml';
import { Client, fetchExchange } from '@urql/core';
import { DateTime } from 'luxon';
import * as priceModifiers from './Price/Modifiers.js';
import { GraphQLClient } from '@happy-path/graphql-client';

dotenv.config();

Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}

// TODO: Billable olmayan task tipleri?
// TODO: import statements
// TODO: proje datasının hook'dan gelmesi
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
    const queryResponse = await GraphQLClient.query(TimersQuery, { timerId });
    if(queryResponse.data != undefined && queryResponse.data.timers_by_id != undefined) {
      // Calculate totalDuration
      let startsAt, endsAt;
      let totalDuration = queryResponse?.data?.timers_by_id?.total_duration || 0;
      if(queryResponse.data.timers_by_id.starts_at && queryResponse.data.timers_by_id.ends_at) {
        startsAt = DateTime.fromISO(queryResponse.data.timers_by_id.starts_at);
        endsAt = DateTime.fromISO(queryResponse.data.timers_by_id.ends_at);
        const duration = endsAt.diff(startsAt, 'minutes');
        const { minutes: durationInMinutes } = duration.toObject();
        totalDuration = Math.floor(durationInMinutes + queryResponse.data.timers_by_id.duration);
      }
      const totalDurationInHours = +((totalDuration / 60).toFixed(2));
      // Calculate totalCost
      let totalCost = 0, defaultMetadataString = '';
      if(queryResponse.data.timers_by_id.task?.projects_id?.metadata != undefined && req.body?.metadata[0]?.metadata != undefined) {
        defaultMetadataString += req.body.metadata[0].metadata.trim();
        defaultMetadataString += '\n';
        defaultMetadataString += queryResponse.data.timers_by_id.task.projects_id.metadata;
        try {
          const totalCost = calculateTotalCost({metadata: defaultMetadataString, totalDurationInHours, totalDuration, userId: queryResponse.data.timers_by_id.user_id.slack_user_id, startsAt, endsAt: DateTime.now()});
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

const calculateTotalDurationRegularly = async (req, res, next) => {
  // TODO: Should update only if there are changed values
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
  const queryResponse = await GraphQLClient.query(ProjectMetadataQuery, { projectTaskId });
  if(queryResponse?.data?.projects_tasks_by_id.projects_id != undefined && typeof queryResponse.data.projects_tasks_by_id.projects_id == 'object') {
    return { status: true, data: queryResponse.data.projects_tasks_by_id.projects_id }
  }
  else {
    throw new Error(queryResponse.error);
  }
  return { status: false }
}

const initSlackClient = () => {
  const { App, LogLevel } = bolt;
  const slackClientApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    logLevel: LogLevel.INFO,
    socketMode: false
  });
  return slackClientApp;
}

// TODO: Email users may not have slack ids
const notifyUsersWithAbsentTimers = async (req, res, next) => {
  const slackClientApp = initSlackClient();
  const queryResponse = await GraphQLClient.query(UserTimersQuery, { 
    startsAt: DateTime.now().toFormat("yyyy-MM-dd'T00:00:00'"), 
    endsAt: DateTime.now().toFormat("yyyy-MM-dd'T23:59:59'")
  });
  const usersWithNoTimers = queryResponse.data.users.filter(item => item.timers.length == 0);
  const usersWithLowTimers = queryResponse.data.users.filter(item => { 
    if(item.timers.length > 0) {
      const totalTimerLength = item.timers.reduce((acc, item) => acc + item.total_duration, 0);
      return (totalTimerLength < process.env.LOW_TIMER_TRESHOLD || 120);
    }
    return false;
  });
  usersWithNoTimers.forEach(item => {
    slackClientApp.client.chat.postMessage({
      channel: item.slack_user_id,
      text: `You haven't started any timers ⏳ today. Care to log some time? 🙏`
    });
  });
  usersWithLowTimers.forEach(item => {
    slackClientApp.client.chat.postMessage({
      channel: item.slack_user_id,
      text: `How is your day going? I see that you haven't logged much time ⏳ today. Care to log more time? 🙏`
    });
  });
  res.json({ok: true, numOfUsersWithNoTimers: usersWithNoTimers.length, numOfUsersWithLowTimers: usersWithLowTimers.length});
}

const notifyUsersWithProlongedTimers = async (req, res, next) => {
  // TODO: Email users may not have slack ids, in that case messages  wouldn'e be delivered
  // FIXME: Slack messages are not delivered
  if(req.body.data != undefined && typeof req.body.data == 'object') {
    const slackClientApp = initSlackClient();
    req.body.data.forEach(async (item) => {
      res.log.debug(item);
      if(item.ends_at == undefined || item.ends_at == null) {
        const startsAt = DateTime.fromISO(item.starts_at);
        const { minutes: durationInMinutes } = DateTime.now().diff(startsAt, 'minutes').toObject();
        if(durationInMinutes >= (process.env.PROLONGED_TIMER_SHUTDOWN_TRESHOLD || 480)) {
          const mutation = await GraphQLClient.mutation(StopTimerMutation, { 
            timerId: item.id, 
            endsAt: DateTime.now().toISO() 
          });
          if(mutation.error == undefined) {
            try {
              await slackClientApp.client.chat.postMessage({
                channel: item.user_id,
                text: `Ok, let's stop your timer now 🏁, you've done great. Go ahead and start a new timer ⏱️ if you're still here.`
              });
            }
            catch(e) {
              res.log.error(e);
            }
          }
          else {
            res.log.error(mutation.error);
          }
        }
        else if(durationInMinutes >= (process.env.PROLONGED_TIMER_TRESHOLD_2 || 420)) {
          try {
            await slackClientApp.client.chat.postMessage({
              channel: item.user_id,
              text: `You're marvellous 👑, but I start to worry. Are you still there? 👀 I'll shut down your timer within the next hour.`
            });
          }
          catch(e) {
            res.log.error(e);
          }
        }
        else if(durationInMinutes >= (process.env.PROLONGED_TIMER_TRESHOLD_1 || 240)) {
          const messages = [
            `You're such a hard worker 💪. It's been hours ⏱️ and you're still going. Keep it up. 👍`,
            `It's been quite some time since you started 👀, care to give some break?`,
            `Are you still there? It's been hours ⏱️, keep up the good work. 👍`,
            `You're unstoppable 🚀, keep it going. 👍`
          ];
          try {
            await slackClientApp.client.chat.postMessage({
              channel: item.user_id,
              text: messages.random()
            });
          }
          catch(e) {
            res.log.error(e);
          }
        }
        else {}
      }
    });
    res.json({ok: true}); 
  }
  else {
    res.log.debug(req.body);
    res.status(403).send({error: `Requested data is missing. Exiting.`});
  }
}

const ProjectMetadataQuery = `
  query projects_tasks_by_id($projectTaskId: ID!) {
    projects_tasks_by_id(id: $projectTaskId) {
      projects_id {
        metadata
      }
    }
  }
`;

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
        slack_user_id
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

const StopTimerMutation = `
  mutation update_timers_item($timerId: ID!, $endsAt: Date!) {
    update_timers_item(id: $timerId, data: {ends_at: $endsAt}) {
      id
      total_duration
      starts_at
      ends_at
    }
  }
`;

const UserTimersQuery = `
  query users($startsAt: String!, $endsAt: String!) {
    users {
      timers(
      filter: {starts_at: {_gte: $startsAt}, ends_at: {_lte: $endsAt}}
      ) {
        duration
        total_duration
      }
      slack_user_id
    }
  }
`;

export { calculateTotalDuration, calculateTotalDurationRegularly, notifyUsersWithAbsentTimers, notifyUsersWithProlongedTimers }