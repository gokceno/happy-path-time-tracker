import { DateTime } from 'luxon';
import { staticSelect, input, datePicker, timeEntriesList } from './UI/Blocks.js';
import { title as titleElement, submit as submitElement } from'./UI/Elements.js';
import { staticSelect as staticSelectFormatter } from './Formatters.js';
import { Tasks } from '@happy-path/graphql-entities';
import { Timers } from '@happy-path/graphql-entities';
import { GraphQLClient as graphqlClient } from '@happy-path/graphql-client';

const selectProjectId = async ({ ack, body, client, logger }, previousActionId, callbackId) => {
  await ack();
  try {
    const tasks = Tasks({ 
      graphqlClient, 
      queryParams: {
        projectId: body.view.state.values['block__project_list'][previousActionId].selected_option.value
      } 
    });
    let blocks = [
      staticSelect({id: 'block__task_type', options: await tasks.list(staticSelectFormatter), label: 'Task type', placeholder: 'Select a task type', actionId: 'action__task_type'}),
      input({id: 'block__task_comment', label: 'What are you working on?', actionId: 'action__task_comment', isMultiline: true}),
      input({id: 'block__duration', label: 'Duration (optional, in minutes)', initialValue: '0', actionId: 'action__duration', type: 'number_input' })
      ];
    if(previousActionId == 'log__action__select_project_id') {
      blocks.push(datePicker({ id: 'block__on_date', actionId: 'action__on_date', label: 'Select a date to log' }));
    }
    const result = await client.views.update({
      trigger_id: body.trigger_id,
      view_id: body.view.id,
      hash: body.view.hash,
      view: {
        type: 'modal',
        callback_id: callbackId,
        title: titleElement({ title: 'Set timer details' }),
        blocks,
        submit: submitElement()
      }
    });
    logger.debug(result);
  }
  catch (error) {
    logger.error(error);
  }
}

// TODO: If user has requested to view another day, it resorts back to today once an item is deleted.
const removeTimerItem = async ({ ack, body, client, logger }) => {
  await ack();
  try {
    const timers = Timers({ graphqlClient });
    const { status } = await timers.remove({ timerId: body.actions[0].value });
    if(status == true) {
      const timersList = await timers.list({ 
        externalUserId: body.user.id, 
        startsAt: DateTime.now().toFormat("yyyy-MM-dd'T'00:00:00"), 
        endsAt: DateTime.now().toFormat("yyyy-MM-dd'T'23:59:59") 
      });
      const result = await client.views.update({
        trigger_id: body.trigger_id,
        view_id: body.view.id,
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
      await client.chat.postMessage({
        channel: body['user']['id'],
        text: `You just removed a time entry 👍`
      });
    }
  }
  catch (error) {
    logger.error(error);
  }
}

const editTimerItem = async ({ ack, body, client, logger }) => {
  await ack();
  try {
    const timers = Timers({ graphqlClient });
    const { data } = await timers.get({ timerId: body.actions[0].value });
    let blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "💡 You can only edit certain fields in a time entry, feel free to recreate it, if it doesn't work for you.",
        },
      },
      {
        type: "divider",
      },
      input({id: 'block__task_comment', initialValue: data.notes, label: 'What are you working on?', actionId: 'action__task_comment', isMultiline: true}),
      input({id: 'block__duration', initialValue: data.duration + '', label: 'Duration (optional, in minutes)', actionId: 'action__duration', type: 'number_input' }),
    ];
    if(data.starts_at == data.ends_at) {
      blocks.push(datePicker({ id: 'block__on_date', actionId: 'action__on_date', label: 'Select a date', initialDate: DateTime.fromISO(data.starts_at).toFormat('yyyy-MM-dd') }));
    }
    const result = await client.views.update({
      trigger_id: body.trigger_id,
      view_id: body.view.id,
      hash: body.view.hash,
      view: {
        type: 'modal',
        private_metadata: body.actions[0].value,
        callback_id: 'view__edit_timer_details',
        title: titleElement({ title: 'Edit timer details' }),
        blocks,
        submit: submitElement()
      }
    });
    logger.debug(result);
  }
  catch (error) {
    logger.error(error);
  }
}

export { selectProjectId, removeTimerItem, editTimerItem };