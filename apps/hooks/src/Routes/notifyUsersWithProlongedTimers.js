import dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { GraphQLClient } from '@happy-path/graphql-client';
import { SlackClient as slackClientApp } from '@happy-path/slack-client';

dotenv.config();

Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}

const notifyUsersWithProlongedTimers = async (req, res, next) => {
  const startAt = DateTime.now().minus({ minutes: process.env.PROLONGED_TIMER_TRESHOLD_1 || 240 }).toISO();
  const queryResponse = await GraphQLClient.query(TimersWithNoEndDateQuery,{ startAt });
  if(queryResponse?.data?.timers != undefined && queryResponse?.data?.timers.length > 0) {
    queryResponse.data.timers.forEach(async (item) => {
      res.log.debug(item);
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
              channel: item.user_id.slack_user_id,
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
            channel: item.user_id.slack_user_id,
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
            channel: item.user_id.slack_user_id,
            text: messages.random()
          });
        }
        catch(e) {
          res.log.error(e);
        }
      }
      else {}
    });
    res.json({ok: true}); 
  }
  else {
    res.log.debug(req.body);
    res.status(404).send({error: `No running timers were found. Exiting.`});
  }
}

const TimersWithNoEndDateQuery = `
  query Timers($startAt: String!) {
    timers(filter: {ends_at: {_null: null}, starts_at: {_lte: $startAt}}) {
      id
      user_id {
        email
        slack_user_id
      }
      starts_at
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

export { notifyUsersWithProlongedTimers }