import dotenv from 'dotenv';
import { SlackClient as app } from '@happy-path/slack-client';
import { setTimerDetails as setTimerDetailsView, editTimerItem as editTimerItemView } from'./src/Views.js';
import { selectProjectId, removeTimerItem as removeTimerItemAction, editTimerItem as editTimerItemAction } from './src/Actions.js';
import { start, stop, status, list, sync } from './src/Commands.js';

dotenv.config();

app.action('start__action__select_project_id', async({ ack, body, client, logger }) => {
  await selectProjectId({ ack, body, client, logger }, 'start__action__select_project_id', 'view__set_timer_details');
});

app.action('log__action__select_project_id', async({ ack, body, client, logger }) => {
  await selectProjectId({ ack, body, client, logger }, 'log__action__select_project_id', 'view__set_timer_details');
});

app.action('action__remove_time_entry', removeTimerItemAction);

app.action('action__edit_time_entry', editTimerItemAction);

app.view('view__set_timer_details', setTimerDetailsView);

app.view('view__edit_timer_details', editTimerItemView);

app.command('/happy', async({ command, respond, ack, body, client, logger }) => {
  const [commandName] = (command.text ? command.text : '').split(' '); // Values: start|log|stop|show|list|sync
  if (commandName != undefined) {
    switch(commandName) {
      case 'stop':
        stop({ command, respond, ack, body, client, logger });
        break;
      case 'show':
        status({ command, respond, ack, body, client, logger });
        break;
      case 'list':
        list({ command, respond, ack, body, client, logger });
        break;
      case 'sync':
        sync({ command, respond, ack, body, client, logger });
        break;
      case 'start':
        await start({ command, respond, ack, body, client, logger }, 'start__action__select_project_id');
        break;
      case 'log':
        await start({ command, respond, ack, body, client, logger }, 'log__action__select_project_id');
        break;
      default:
        await ack();
        await respond(`🚨🚨🚨 Command not found. Available sub-commands are start, log, stop, show, list, sync. Good luck 🍀`);
    }
  }
  else {
    await ack();
    await respond(`Please type a valid command. Available sub-commands are start, log, stop, show, list, sync. Good luck 🍀`);
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();



