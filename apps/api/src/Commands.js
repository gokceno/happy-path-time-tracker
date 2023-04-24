const { DateTime, Duration } = require('luxon');
const { title: titleElement } = require('./UI/Elements.js');
const { timeEntriesList } = require('./UI/Blocks.js');
const { Projects, Timers } = require('./Entities.js');
const { GraphQLClient: graphqlClient } = require('./GraphQLClient.js');

// TODO: Must start users own timer only.
const start = async ({ command, respond, ack, body, client, logger }) => {
  await ack();
  try {
    const timers = Timers({ graphqlClient });
    const { hasRunningTimer } = await timers.status();
    if(!hasRunningTimer) {
      const projects = Projects({ graphqlClient });
      const result = await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          title: titleElement({ title: 'Select a project' }),
          blocks: [
            {
              "type": "actions",
              "block_id": "block__project_list",
              "elements": [{
                "type": "static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select a project",
                },
                "options": await projects.list(),
                "action_id": "start__action__select_project_id"
              }]
            },
          ]
        }
      });
      logger.debug(result);
    }
    else {
      await respond('You have a running timer, please stop it first with /stop command. Good luck 🍀');
    }
  }
  catch (error) {
    await respond(`🚨🚨🚨 ${error}`);
    logger.error(error);
  }
}

// TODO: Must stop users own timer only.
const stop = async ({ command, respond, ack, body, client, logger }) => {
  await ack();
  try {
    const timers = Timers({ graphqlClient });
    const { status, data } = await timers.stop();
    if(status === true) {
      await respond(`Running timer ⏳ stopped at ${DateTime.now().toLocaleString(DateTime.TIME_SIMPLE)}. You logged a total time of ${Duration.fromObject({minutes: data.duration}).toHuman({ unitDisplay: 'short' })}. Good job 👍`);
    }
    else {
      await respond(`You don't have any running timers. You can start a new timer by typing /start. Good luck 🍀`); 
    }
  }
  catch (error) {
    await respond(`🚨🚨🚨 ${error}`);
    logger.error(error);
  }
}

// TODO: Must show users own timer only.
const status = async ({ command, respond, ack, body, client, logger }) => {
  await ack();
  try {
    const timers = Timers({ graphqlClient });
    const {timer, hasRunningTimer } = await timers.status();
    if(hasRunningTimer === true) {
      await respond(`You have a running timer for ${Duration.fromObject({minutes: timer.duration}).toHuman({ unitDisplay: 'short' })}, from project ${timer.task.projects_id.project_name}. Keep going 🏁`);
    }
    else {
      await respond(`You don't have any running timers. You can start a new timer by typing /start. Good luck 🍀`);
    }
  }
  catch (error) {
    await respond(`🚨🚨🚨 ${error}`);
    logger.error(error);
  }
}

// TODO: Must list users own timer only.
const list = async ({ command, respond, ack, body, client, logger }) => {
  await ack();

  /*
  console.log(body['user_id']);
  const t = await client.users.info({user: 'U053CF5Q6DB'});
  console.log(t);
  */

  try {
    const timers = Timers({ graphqlClient });
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        "type": "modal",
        "close": {
          "type": "plain_text",
          "text": "Close",
          "emoji": true
        },
        "title": titleElement({ title: 'Time Entries' }),
        "blocks": timeEntriesList({ blocks: await timers.list({ startsAt: DateTime.now().toFormat("yyyy-MM-dd'T'00:00:00"), endsAt: DateTime.now().toFormat("yyyy-MM-dd'T'23:59:59") }) })
      }
    });
    logger.debug(result);
  }
  catch (error) {
    await respond(`🚨🚨🚨 ${error}`);
    logger.error(error);
  }
}

module.exports = { start, stop, status, list };