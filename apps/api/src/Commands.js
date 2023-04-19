const { Client, fetchExchange } = require('@urql/core');
const { title: titleElement } = require('./UI/Elements.js');
const { Projects } = require('./Entities.js');

const start = async ({ command, respond, ack, body, client, logger }) => {
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
              "action_id": "action__select_project_id"
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
}

module.exports = { start };