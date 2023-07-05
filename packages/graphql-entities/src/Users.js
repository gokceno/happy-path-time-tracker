const Users = ({ graphqlClient }) => {
  const _create = async (params) => {
    const {firstName, lastName, timezone, externalId} = params;
    const CreateUserMutation = `
      mutation create_users_item($firstName: String, $lastName: String, $timezone: String!, $externalId: ID!) {
        create_users_item(
        data: {slack_user_id: $externalId, first_name: $firstName, last_name: $lastName, timezone: $timezone}
        ) {
          id
        }
      }
    `;
    const response = await graphqlClient.mutation(CreateUserMutation, {
      firstName,
      lastName,
      timezone,
      externalId
    });
    if(response.error == undefined) {
      return { status: true, data: response.data.create_users_item };
    }
    else {
      throw new Error(response.error);
      logger.error(response.error);
    }
  }
  const sync = async(params) => {
    return await _create(params);
  }
  return { sync }
}

export { Users }