const Users = ({ client }) => {
  const _create = async (params) => {
    const {firstName, lastName, timezone, externalUserId, email } = params;
    const CreateUserMutation = `
      mutation create_users_item($firstName: String, $lastName: String, $timezone: String, $externalUserId: String, $email: String) {
        create_users_item(
          data: {slack_user_id: $externalUserId, first_name: $firstName, last_name: $lastName, timezone: $timezone, email: $email}
        ) {
          id
        }
      }
    `;
    const response = await client.mutation(CreateUserMutation, {
      firstName,
      lastName,
      timezone,
      externalUserId,
      email
    });
    if(response.error == undefined) {
      return { status: true, data: response.data.create_users_item };
    }
    else {
      throw new Error(response.error);
    }
  }
  const _update = async (params) => {
    const {firstName, lastName, timezone, externalUserId, email, userId } = params;
    const UpdateUserMutation = `
      mutation update_users_item($firstName: String, $lastName: String, $timezone: String, $externalUserId: String, $email: String, $userId: ID!) {
        update_users_item(
          data: {
            email: $email, 
            timezone: $timezone, 
            last_name: $lastName, 
            first_name: $firstName,
            slack_user_id: $externalUserId
          }
          id: $userId
        ) {
          id
        }
      }
    `;
    const response = await client.mutation(UpdateUserMutation, {
      firstName,
      lastName,
      timezone,
      externalUserId,
      email,
      userId
    });
    if(response.error == undefined) {
      return { status: true, data: response.data.update_users_item };
    }
    else {
      throw new Error(response.error);
    }
  }
  const findUserId = async (params) => {
    // TODO: Simplfy the if-blocks
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
      const queryResponse = await client.query(UserQuery, { did });
      if(queryResponse?.data?.users != undefined && typeof queryResponse?.data?.users == 'object') {
        if(queryResponse.data.users.length == 0) return null;
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
      const queryResponse = await client.query(UserQuery, { email });
      if(queryResponse?.data?.users != undefined && typeof queryResponse?.data?.users == 'object') {
        if(queryResponse.data.users.length == 0) return null;
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
      const queryResponse = await client.query(UserQuery, { externalUserId });
      if(queryResponse?.data?.users != undefined && typeof queryResponse?.data?.users == 'object') {
        if(queryResponse.data.users.length == 0) return null;
        return +queryResponse.data.users[0].id;
      }
      else {
        throw new Error(queryResponse.error);
      }
    }
    return null;
  }
  const syncByExternalUserId = async(params) => {
    const { externalUserId } = params;
    try {
      const userId = await findUserId({ externalUserId });
      if(userId != undefined && userId != null) {
        return await _update({ ...params, userId });
      }
      else {
        return await _create(params);
      }
    }
    catch(e) {
      return { status: false }
    }
  }
  const syncByEmail = async(params) => {
    const { email } = params;
    try {
      const userId = await findUserId({ email });
      if(userId != undefined && userId != null) {
        return await _update({ ...params, userId });
      }
      else {
        return await _create(params);
      }
    }
    catch(e) {
      return { status: false }
    }
  }
  const findUsersByTimerDate = async(params) => {
    const { startsAt, endsAt } = params;
    if(startsAt == undefined && endsAt == undefined) throw new Error('Missing arguments');
    const UserTimersQuery = `
      query users($startsAt: String!, $endsAt: String!) {
        users {
          timers(
          filter: {starts_at: {_gte: $startsAt}, ends_at: {_lte: $endsAt}}
          ) {
            duration
            total_duration
          }
          slack_user_id
          email
        }
      }
    `;
    const response = await client.query(UserTimersQuery);
    return response?.data?.users || [];
  }
  return { syncByExternalUserId, syncByEmail, findUserId, findUsersByTimerDate }
}

export { Users }