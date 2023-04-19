const { title: titleElement } = require('./UI/Elements.js');
const { Projects } = require('./Entities.js');
const { GraphQLClient: graphqlClient } = require('./GraphQLClient.js');

const start = async ({ command, respond, ack, body, client, logger }) => {
  await ack();
  try {
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