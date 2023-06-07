import { DateTime, Duration } from 'luxon';
import { title as titleElement } from './UI/Elements.js';
import { timeEntriesList } from './UI/Blocks.js';
import { Timers } from './Entities/Timers.js';
import { Projects } from './Entities/Projects.js';
import { Users } from './Entities/Users.js';
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
              type: "section",
              text: {
                type: "mrkdwn",
                text: "💡 Remaining options will be displayed in the next screen.",
              },
            },
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
      await respond('You have a running timer, please stop it first with /happy stop command. Good luck 🍀');
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
      await respond(`Running timer ⏳ for "${data.task.tasks_id.task_name}" in "${data.task.projects_id.project_name}" stopped at ${DateTime.now().toLocaleString(DateTime.TIME_SIMPLE)}. You logged a total time of ${Duration.fromObject({minutes: data.total_duration}).toHuman({ unitDisplay: 'short' })}. Good job 👍`);
    }
    else {
      await respond(`You don't have any running timers. You can start a new timer by typing /happy start. Good luck 🍀`); 
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
      await respond(`You have a running timer for ${Duration.fromObject({minutes: timer.total_duration}).toHuman({ unitDisplay: 'short' })}, for project ${timer.task.projects_id.project_name}. Keep going 🏁`);
    }
    else {
      await respond(`You don't have any running timers. You can start a new timer by typing /happy start. Good luck 🍀`);
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
    const commandTextTokens = command.text.split(' ');
    let startsAt, endsAt, humanReadableDateInterval;
    if(commandTextTokens.length == 3) {
      const [commandName, startDateInput, endDateInput] = commandTextTokens;
      startsAt = DateTime.fromISO(startDateInput + 'T00:00:00');
      endsAt = DateTime.fromISO(endDateInput + 'T23:59:59');
      if(!startsAt.isValid || !endsAt.isValid) {
        throw new Error('Supplied dates are not in correct format (eg. 2023-12-31)');
      }
      if(startsAt.diff(endsAt, 'days').toObject().days < -7) {
        throw new Error('You can list time entries for a maximum duration of 7 days.');
      }
      humanReadableDateInterval = `${startsAt.toFormat('dd LLL, yyyy')} - ${endsAt.toFormat('dd LLL, yyyy')}`;
    }
    else {
      const [commandName, dateInterval = 'today'] = commandTextTokens; // Values: today|yesterday
      if(dateInterval === 'yesterday') {
        startsAt = DateTime.now().minus({ days: 1 }).toFormat("yyyy-MM-dd'T'00:00:00");
        endsAt = DateTime.now().minus({ days: 1 }).toFormat("yyyy-MM-dd'T'23:59:59");
        humanReadableDateInterval = dateInterval;
      }
      else {
        startsAt = DateTime.now().toFormat("yyyy-MM-dd'T'00:00:00");
        endsAt = DateTime.now().toFormat("yyyy-MM-dd'T'23:59:59");
        humanReadableDateInterval = 'today';
      }
    }
    if(startsAt === undefined || endsAt === undefined) {
      throw new Error('Missing start date or end date parameter.');
    }
    const timers = Timers({ graphqlClient });
    const timersList = await timers.list({ externalUserId: body['user_id'], startsAt, endsAt });
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
      await respond(`You don't have any time entries ⌛️ for ${humanReadableDateInterval}. Use /happy start to start a new timer. Good luck 🍀`);
    }
  }
  catch (error) {
    await respond(`🚨🚨🚨 ${error}`);
    logger.error(error);
  }
}

// TODO: İki kez çalıştırınca hata veriyor.
const sync = async ({ command, respond, ack, body, client, logger }) => {
  await ack();
  try {
    const result = await client.users.info({ user: body['user_id'] });
    if(result.ok == true) {
      const users = Users({ graphqlClient });
      const { status, data } = await users.sync({ 
        externalId: result.user.id,
        firstName: result.user.profile.first_name,
        lastName: result.user.profile.last_name,
        timezone: result.user.tz
      });
      logger.debug(data);
      if(status === true) {
        await respond(`User info synced. This was a one-off operation. Good job 👍`);
      }
      else {
        await respond(`Couldn't sync user info 🤦`); 
      }
    }
    else {
      await respond(`Unable to get user info 🤦`); 
      logger.debug(result);
    }
  }
  catch (error) {
    await respond(`🚨🚨🚨 ${error}`);
    logger.error(error);
  }
}


export { start, stop, status, list, sync };