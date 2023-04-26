import { Client, fetchExchange } from '@urql/core';
import { DateTime, Duration } from 'luxon';
import { Timers } from './Entities/Timers.js';
import { GraphQLClient as graphqlClient } from './GraphQLClient.js';

// TODO: Catch errors should notify users
const setTimerDetails = async ({ ack, body, view, client, logger }) => {
  await ack();
  const timers = Timers({ graphqlClient });
  const duration = view['state']['values']['block__duration']['action__duration'].value;
  try {
    const commonParams = {
      externalUserId: body['user']['id'],
      projectTaskId: view['state']['values']['block__task_type']['action__task_type'].selected_option.value, 
      taskComment: view['state']['values']['block__task_comment']['action__task_comment'].value,
      duration
    }
    if(view['state']['values']['block__on_date'] != undefined) {
      const onDate = view['state']['values']['block__on_date']['action__on_date'].selected_date;
      await timers.log({
        ...commonParams,
        startsAt: onDate + 'T00:00:00',
        endsAt: onDate + 'T00:00:00'
      });
      await client.chat.postMessage({
        channel: body['user']['id'],
        text: `Congratulations 🎉, you logged ${Duration.fromObject({minutes: duration}).toHuman({ unitDisplay: 'short' })} to ${DateTime.fromISO(onDate).toLocaleString(DateTime.DATE_MED)}. Keep it going 🏁`
      });
    }
    else {
      await timers.start(commonParams);
      await client.chat.postMessage({
        channel: body['user']['id'],
        text: `Congratulations 🎉, you started a new timer ⏳ at ${DateTime.now().toLocaleString(DateTime.TIME_SIMPLE)}. You can stop it with /stop once you're done with it.`
      });
    }
  }
  catch (error) {
    logger.error(error);
  }
}

export { setTimerDetails };