const { Client, fetchExchange } = require('@urql/core');
const { staticSelect, input } = require('./UI/Blocks.js');
const { title: titleElement } = require('./UI/Elements.js');
const { Tasks} = require('./Entities.js');

const selectProjectId = async ({ ack, body, client, logger }) => {
  await ack();
  try {
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
    const tasks = Tasks({ 
      graphqlClient, 
      queryParams: {
        projectId: body.view.state.values['block__project_list']['action__select_project_id'].selected_option.value
      } 
    });
    const result = await client.views.update({
      trigger_id: body.trigger_id,
      view_id: body.view.id,
      hash: body.view.hash,
      view: {
        type: 'modal',
        callback_id: 'view__set_timer_details',
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
}

module.exports = { selectProjectId };