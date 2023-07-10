import dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { GraphQLClient } from '@happy-path/graphql-client';
import { Notification } from '@happy-path/notification';

dotenv.config();

const notifyUsersWithAbsentTimers = async (req, res, next) => {
  const queryResponse = await GraphQLClient.query(UserTimersQuery, { 
    startsAt: DateTime.now().toFormat("yyyy-MM-dd'T00:00:00'"), 
    endsAt: DateTime.now().toFormat("yyyy-MM-dd'T23:59:59'")
  });
  if(queryResponse?.data?.users != undefined) {
    const usersWithNoTimers = queryResponse.data.users.filter(item => item.timers.length == 0);
    const usersWithLowTimers = queryResponse.data.users.filter(item => { 
      if(item.timers.length > 0) {
        const totalTimerLength = item.timers.reduce((acc, item) => acc + item.total_duration, 0);
        return (totalTimerLength < process.env.LOW_TIMER_TRESHOLD || 120);
      }
      return false;
    });
    usersWithNoTimers.forEach(item => {
      Notification()
      .addRecipent(item.slack_user_id, 'slack')
      .addRecipent(item.email, 'email')
      .send({ message: `You haven't started any timers ⏳ today. Care to log some time? 🙏` });
    });
    usersWithLowTimers.forEach(item => {
      Notification()
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
      email
    }
  }
`;

export { notifyUsersWithAbsentTimers }