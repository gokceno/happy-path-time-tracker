import dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { Backend as GraphQLClient } from '@happy-path/graphql-client';
import { Notification } from '@happy-path/notification';
import { Users } from '@happy-path/graphql-entities';

dotenv.config();

const notify = async (req, res, next) => {
  const users = await Users({ client: GraphQLClient(), timezone: process.env.TIMEZONE || 'UTC' }).findUsersByTimerDate({
    startsAt: DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).startOf('day').toISO(), 
    endsAt: DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).endOf('day').toISO(),
  });
  if(users != undefined) {
    const usersWithNoTimers = users.filter(item => item.timers.length == 0);
    const usersWithLowTimers = users.filter(item => { 
      if(item.timers.length > 0) {
        const totalTimerLength = item.timers.reduce((acc, item) => acc + item.total_duration, 0);
        return (totalTimerLength < (process.env.LOW_TIMER_TRESHOLD || 120));
      }
      return false;
    });
    usersWithNoTimers.forEach(async (item) => {
      await Notification()
        .addRecipent(item.slack_user_id, 'slack')
        .addRecipent(item.email, 'email')
        .send({ message: `You haven't started any timers ⏳ today. Care to log some time? 🙏` });
    });
    usersWithLowTimers.forEach(async (item) => {
      await Notification()
        .addRecipent(item.slack_user_id, 'slack')
        .addRecipent(item.email, 'email')
        .send({ message: `How is your day going? I see that you haven't logged much time ⏳ today. Care to log more time? 🙏` });
    });
    res.json({ok: true, numOfUsersWithNoTimers: usersWithNoTimers.length, numOfUsersWithLowTimers: usersWithLowTimers.length});
  }
  else {
    res.status(404).send({error: `No absent timers were found. Exiting.`});
  }
}

export { notify }