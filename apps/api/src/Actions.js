import { staticSelect, input, datePicker } from './UI/Blocks.js';
import { title as titleElement, submit as submitElement } from'./UI/Elements.js';
import { Tasks } from './Entities/Tasks.js';
import { GraphQLClient as graphqlClient } from './GraphQLClient.js';

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
      staticSelect({id: 'block__task_type', options: await tasks.list(), label: 'Task type', placeholder: 'Select a task type', actionId: 'action__task_type'}),
      input({id: 'block__task_comment', label: 'What are you working on?', actionId: 'action__task_comment', isMultiline: true}),
      input({id: 'block__duration', label: 'Duration (in minutes)', actionId: 'action__duration', type: 'number_input' })
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

export { selectProjectId };