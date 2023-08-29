import dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { Backend as GraphQLClient } from '@happy-path/graphql-client';
import { Notification } from '@happy-path/notification';
import { Timers } from '@happy-path/graphql-entities';

dotenv.config();

const notify = async (req, res, next) => {
  const startsBefore = DateTime.now().minus({ minutes: process.env.PROLONGED_TIMER_TRESHOLD_1 || 240 }).toISO();
  const timers = await Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' }).findTimersByNoEndDate({ startsBefore }); 
  if(timers.length > 0) {
    timers.forEach(async (item) => {
      let message;
      const startsAt = DateTime.fromISO(item.starts_at);
      const { minutes: durationInMinutes } = DateTime.now().diff(startsAt, 'minutes').toObject();
      if(durationInMinutes >= (process.env.PROLONGED_TIMER_SHUTDOWN_TRESHOLD || 480)) {
        try {
          const mutation = await Timers({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' }).stop({ timerId: item.id, userId: item.user_id.id });
          if(mutation.status === true) {
            message = `Ok, let's stop your timer now 🏁, you've done great. Go ahead and start a new timer ⏱️ if you're still here.`;
          }
        }
        catch(e) {
          res.log.error(e);
        }
      }
      else if(durationInMinutes >= (process.env.PROLONGED_TIMER_TRESHOLD_2 || 420)) {
        message = `You're marvellous 👑, but I start to worry. Are you still there? 👀 I'll shut down your timer within the next hour.`;
      }
      else if(durationInMinutes >= (process.env.PROLONGED_TIMER_TRESHOLD_1 || 240)) {
        message = [
          `You're such a hard worker 💪. It's been hours ⏱️ and you're still going. Keep it up. 👍`,
          `It's been quite some time since you started 👀, care to give some break?`,
          `Are you still there? It's been hours ⏱️, keep up the good work. 👍`,
          `You're unstoppable 🚀, keep it going. 👍`
        ].random();
      }
      else {}
      if(message != undefined) {
        await Notification()
          .addRecipent(item.user_id.slack_user_id, 'slack')
          .addRecipent(item.user_id.email, 'email')
          .send({ message });
      }
    });
    res.json({ok: true}); 
  }
  else {
    res.log.debug(req.body);
    res.status(404).send({error: `No running timers were found. Exiting.`});
  }
}

export { notify }