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
  const findUserId = async (params) => {
    const { externalUserId, email, did, userId } = params;
    if(userId == undefined && externalUserId == undefined && email == undefined && did == undefined) throw new Error('A user identifier must be set');
    if(userId !== undefined) return +userId;
    if(did !== undefined) {
      const UserQuery = `
      query users($did: String!) {
        users(filter: {did: {_eq: $did}}) {
          id
        }
      }
      `;
      const queryResponse = await graphqlClient.query(UserQuery, { did });
      if(queryResponse?.data?.users != undefined && typeof queryResponse?.data?.users == 'object') {
        if(queryResponse.data.users.length == 0) throw new Error('User not found');
        return +queryResponse.data.users[0].id;
      }
      else {
        throw new Error(queryResponse.error);
      }
    }
    if(email !== undefined) {
      const UserQuery = `
      query users($email: String!) {
        users(filter: {email: {_eq: $email}}) {
          id
        }
      }
      `;
      const queryResponse = await graphqlClient.query(UserQuery, { email });
      if(queryResponse.data != undefined && typeof queryResponse.data.users == 'object') {
        return +queryResponse.data.users[0].id;
      }
      else {
        throw new Error(queryResponse.error);
      }
    }
    if(externalUserId !== undefined) {
      const UserQuery = `
      query users($externalUserId: String!) {
        users(filter: {slack_user_id: {_eq: $externalUserId}}) {
          id
        }
      }
      `;
      const queryResponse = await graphqlClient.query(UserQuery, { externalUserId });
      if(queryResponse.data != undefined && typeof queryResponse.data.users == 'object') {
        return +queryResponse.data.users[0].id;
      }
      else {
        throw new Error(queryResponse.error);
      }
    }
    return null;
  }
  const sync = async(params) => {
    return await _create(params);
  }
  return { sync, findUserId }
}

export { Users }