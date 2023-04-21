const { Client, fetchExchange } = require('@urql/core');
const { DateTime } = require('luxon');
const { Timers } = require('./Entities.js');
const { GraphQLClient: graphqlClient } = require('./GraphQLClient.js');

// TODO: Catch errors should notify users
const setTimerDetails = async ({ ack, body, view, client, logger }) => {
  await ack();
  const user = body['user']['id'];
  const timers = Timers({ graphqlClient });
  try {
    await timers.start({
      projectTaskId: view['state']['values']['block__task_type']['action__task_type'].selected_option.value, 
      taskComment: view['state']['values']['block__task_comment']['action__task_comment'].value,
      duration: view['state']['values']['block__duration']['action__duration'].value
    });
    await client.chat.postMessage({
      channel: user,
      text: `Congratulations 🎉, you started a new timer ⏳ at ${DateTime.now().toLocaleString(DateTime.TIME_SIMPLE)}. You can stop it with /stop once you're done with it.`
    });
  }
  catch (error) {
    logger.error(error);
  }
}

module.exports = { setTimerDetails };