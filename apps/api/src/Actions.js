const { staticSelect, input } = require('./UI/Blocks.js');
const { title: titleElement, submit: submitElement } = require('./UI/Elements.js');
const { Tasks } = require('./Entities.js');
const { GraphQLClient: graphqlClient } = require('./GraphQLClient.js');

const selectProjectId = async ({ ack, body, client, logger }) => {
  await ack();
  try {
    const tasks = Tasks({ 
      graphqlClient, 
      queryParams: {
        projectId: body.view.state.values['block__project_list']['start__action__select_project_id'].selected_option.value
      } 
    });
    const result = await client.views.update({
      trigger_id: body.trigger_id,
      view_id: body.view.id,
      hash: body.view.hash,
      view: {
        type: 'modal',
        callback_id: 'start__view__set_timer_details',
        title: titleElement({ title: 'Set timer details' }),
        blocks: [
          staticSelect({id: 'block__task_type', options: await tasks.list(), label: 'Task type', placeholder: 'Select a task type', actionId: 'action__task_type'}),
          input({id: 'block__task_comment', label: 'What are you working on?', actionId: 'action__task_comment', isMultiline: true}),
          input({id: 'block__duration', label: 'Duration', actionId: 'action__duration', type: 'number_input' })
        ],
        submit: submitElement()
      }
    });
    logger.debug(result);
  }
  catch (error) {
    logger.error(error);
  }
}

module.exports = { selectProjectId };