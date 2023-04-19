const dotenv = require('dotenv');
const { App, LogLevel } = require('@slack/bolt');

const { Projects, Tasks, Timers } = require('./src/Entities.js');
const { staticSelect, input, toggle } = require('./src/UI/Blocks.js');
const { title: titleElement } = require('./src/UI/Elements.js');
const { Client, cacheExchange, fetchExchange } = require('@urql/core');

const { DateTime } = require("luxon");


dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: false,
  logLevel: LogLevel.ERROR,
});

const graphqlClient = new Client({
  url: process.env.DIRECTUS_API_URL,
  exchanges: [fetchExchange],
  fetchOptions: () => {
    const token = process.env.DIRECTUS_API_TOKEN;
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
});

/*
app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  await say({
    blocks: [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `Hey there <@${message.user}>!`
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Click Me"
        },
        "action_id": "button_click"
      }
    }
    ],
    text: `Hey there <@${message.user}>!`
  });
});

app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
});

app.command('/echo', async ({ command, ack, respond }) => {
  // Acknowledge command request
  await ack();

  await respond(`${command.text}`);
});
*/

app.command('/start', async ({ command, respond, ack, body, client, logger }) => {
  await ack();
  try {
    const projects = Projects({ graphqlClient });
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'view_1',
        title: titleElement({ title: 'Select a project' }),
        blocks: [
        {
          "type": "actions",
          "block_id": "deneme",
          "elements": [{
            "type": "static_select",
            "placeholder": {
              "type": "plain_text",
              "text": "Select a project",
            },
            "options": await projects.list(),
            "action_id": "select-project-id"
          }]
        },
        ]
      }
    });
    logger.debug(result);
  }
  catch (error) {
    logger.error(error);
  }
  await respond(`${command.text}`);
});

app.action('select-project-id', async ({ ack, body, client, logger }) => {
  await ack();
  try {
    const tasks = Tasks({ 
      graphqlClient, 
      queryParams: {
        projectId: body.view.state.values.deneme['select-project-id'].selected_option.value
      } 
    });
    const result = await client.views.update({
      trigger_id: body.trigger_id,
      view_id: body.view.id,
      hash: body.view.hash,
      view: {
        type: 'modal',
        callback_id: 'view_1',
        title: titleElement({ title: 'Set timer details' }),
        blocks: [
          staticSelect({id: 'block__task_type', options: await tasks.list(), label: 'Task type', placeholder: 'Select a task type', actionId: 'action__task_type'}),
          input({id: 'block__task_comment', label: 'What are you working on?', actionId: 'action__task_comment', isMultiline: true}),
          input({id: 'block__duration', label: 'Duration', actionId: 'action__duration', type: 'number_input' })
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit'
        }
      }
    });
    logger.debug(result);
  }
  catch (error) {
    logger.error(error);
  }
});

app.view('view_1', async ({ ack, body, view, client, logger }) => {
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
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();



