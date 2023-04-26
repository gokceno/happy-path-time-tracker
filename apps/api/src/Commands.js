import { DateTime, Duration } from 'luxon';
import { title as titleElement } from './UI/Elements.js';
import { timeEntriesList } from './UI/Blocks.js';
import { Timers } from './Entities/Timers.js';
import { Projects} from './Entities/Projects.js';
import { GraphQLClient as graphqlClient } from './GraphQLClient.js';

const start = async ({ command, respond, ack, body, client, logger }, actionId) => {
  await ack();
  try {
    const timers = Timers({ graphqlClient });
    const { hasRunningTimer } = await timers.status({ externalUserId: body['user_id'] });
    if(!hasRunningTimer || actionId == 'log__action__select_project_id') {
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
                "action_id": actionId
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

const stop = async ({ command, respond, ack, body, client, logger }) => {
  await ack();
  try {
    const timers = Timers({ graphqlClient });
    const { status, data } = await timers.stop({ externalUserId: body['user_id'] });
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

const status = async ({ command, respond, ack, body, client, logger }) => {
  await ack();
  try {
    const timers = Timers({ graphqlClient });
    const {timer, hasRunningTimer } = await timers.status({ externalUserId: body['user_id'] });
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

const list = async ({ command, respond, ack, body, client, logger }) => {
  await ack();
  try {
    const timers = Timers({ graphqlClient });
    const timersList = await timers.list({ externalUserId: body['user_id'], startsAt: DateTime.now().toFormat("yyyy-MM-dd'T'00:00:00"), endsAt: DateTime.now().toFormat("yyyy-MM-dd'T'23:59:59") });
    if(timersList.length > 0) {
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
          "blocks": timeEntriesList({ blocks: timersList })
        }
      });
      logger.debug(result);
    }
    else {
      await respond(`You don't have any time entries ⌛️ for today. Use /start to start a new timer. Good luck 🍀`);
    }
  }
  catch (error) {
    await respond(`🚨🚨🚨 ${error}`);
    logger.error(error);
  }
}

export { start, stop, status, list };