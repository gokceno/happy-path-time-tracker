import dotenv from 'dotenv';
import YAML from 'yaml';
import { DateTime } from 'luxon';
import { GraphQLClient } from '@happy-path/graphql-client';
import { SlackClient as slackClientApp } from '@happy-path/slack-client';

dotenv.config();

const notifyUsersWithAbsentTimers = async (req, res, next) => {
  // TODO: Email users may not have slack ids
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

export { notifyUsersWithAbsentTimers }