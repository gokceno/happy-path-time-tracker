const dotenv = require('dotenv');
const { App } = require('@slack/bolt');
const { Projects, Tasks } = require('./src/Entities.js');
const { staticSelect, input } = require('./src/UI/Blocks.js');

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: false
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
    const projects = Projects();
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'view_1',
        title: {
          type: 'plain_text',
          text: 'Modal title'
        },
        blocks: [
        {
          "type": "actions",
          "elements": [{
            "type": "static_select",
            "placeholder": {
              "type": "plain_text",
              "text": "Select a project",
            },
            "options": projects.list(),
            "action_id": "select-reminder-time"
          }]
        },
        ]
      }
    });
    logger.info(result);
  }
  catch (error) {
    logger.error(error);
  }

  await respond(`${command.text}`);
});

app.action('select-reminder-time', async ({ ack, body, client, logger }) => {
  await ack();
  try {
    const tasks = Tasks();
    const result = await client.views.update({
      trigger_id: body.trigger_id,
      view_id: body.view.id,
      hash: body.view.hash,
      view: {
        type: 'modal',
        callback_id: 'view_1',
        title: {
          type: 'plain_text',
          text: 'Modal title'
        },
        "blocks": [
          staticSelect({id: 'block_1', options: tasks.list(), label: 'Task type', placeholder: 'p deneme', actionId: 'denemeAction'}),
          input({id: 'block_2', label: 'What are you working on?', actionId: 'ddd2', isMultiline: true}),
          input({id: 'block_3', label: 'Duration', actionId: 'ddd1', type: 'number_input' })
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit'
        }
      }
    });
    logger.info(result);
  }
  catch (error) {
    logger.error(error);
  }
});

app.view('view_1', async ({ ack, body, view, client, logger }) => {
  await ack();
  const user = body['user']['id'];
  try {
    await client.chat.postMessage({
      channel: user,
      text: `deneme: ${view['state']['values']['block_3']['ddd1'].value}`
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



