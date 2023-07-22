import { DateTime } from 'luxon';
import { Users } from '@happy-path/graphql-entities';

const Timers = ({ graphqlClient }) => {
  const _findRunningTimer = async (params) => {
    const { externalUserId, email, did, userId } = params;
    if(externalUserId == undefined && email == undefined && did == undefined && userId == undefined) throw new Error('A user identifier must be set');
    const actualUserId = await Users({ graphqlClient }).findUserId({ externalUserId, email, did, userId });
    const TimersQuery = `
    query Timers {
      timers(filter: {ends_at: {_null: true}, user_id: {id: {_eq: ${actualUserId} }}}) {
        id
        duration
        total_duration
        starts_at
        ends_at
        task {
          tasks_id {
            task_name
          }
          projects_id {
            project_name
          }
        }
      }
    }
    `;
    const response = await graphqlClient.query(TimersQuery);
    if(response.data.timers.length > 1) {
      throw new Error('Multiple running timers found, manual intervention required.');
    }
    return { 
      timer: response.data.timers[0], 
      hasRunningTimer: (response.data.timers.length == 1)
    };
  }
  const list = async (params, formatter) => { 
    const timers = await findTimersByUserId(params);
    if(formatter !== undefined) {
      return timers.map(item => formatter({ item }));
    }
    return timers;
  }
  const log = async (params) => {
    const { projectTaskId, externalUserId, email, did, taskComment = '', duration = 0, startsAt = DateTime.now().toString(), endsAt = DateTime.now().toString() } = params;
    if(projectTaskId == undefined || (externalUserId == undefined && did == undefined && email == undefined)) {
      throw new Error('Required parameters not set.');
    }
    const userId = await Users({ graphqlClient }).findUserId({ externalUserId, email, did });
    const CreateTimerMutation = `
    mutation create_timers_item($userId: ID!, $duration: Int, $endsAt: Date, $startsAt: Date!, $projectTaskId: ID!, $taskComment: String) {
      create_timers_item(
      data: {user_id: {id: $userId}, duration: $duration, ends_at: $endsAt, starts_at: $startsAt, notes: $taskComment, task: {id: $projectTaskId}}
      ) {
        id
        starts_at
        ends_at
        duration
        task {
          tasks_id {
            task_name
          }
          projects_id {
            project_name
          }
        }
      }
    }
    `;
    const response = await graphqlClient.mutation(CreateTimerMutation, {
      userId,
      duration:+duration,
      projectTaskId: +projectTaskId,
      taskComment,
      startsAt,
      endsAt
    });
    if(response.error == undefined) {
      return { status: true, data: response.data.create_timers_item };
    }
    else {
      throw new Error(response.error);
    }
    return { status: false };
  }
  const stop = async (params) => {
    const { timer, hasRunningTimer } = await _findRunningTimer(params);
    if(hasRunningTimer) {
      const StopTimerMutation = `
      mutation Update_timers_item($timerId: ID!, $endsAt: Date!) {
        update_timers_item(id: $timerId, data: {ends_at: $endsAt}) {
          duration
          total_duration
          task {
            tasks_id {
              task_name
            }
            projects_id {
              project_name
            }
          }
        }
      }
      `;
      const response = await graphqlClient.mutation(StopTimerMutation, {
        timerId: timer.id,
        endsAt: DateTime.now().toString()
      });
      if(response.error == undefined) {
        return { status: true, data: response.data.update_timers_item };
      }
      else {
        throw new Error(response.error);
      }
    }
    return { status: false };
  }
  const remove = async (params) => {
    // TODO: Check user when deleting timer entry
    const { timerId } = params;
    if(timerId == undefined) {
      throw new Error('Required parameters not set.');
    }
    const RemoveTimerMutation = `
    mutation delete_timers_item($timerId: ID!) {
      delete_timers_item(id: $timerId) {
        id
      }
    }
    `;
    const response = await graphqlClient.mutation(RemoveTimerMutation, { timerId });
    if(response.error == undefined) {
      return { status: true, data: response.data.delete_timers_item };
    }
    else {
      throw new Error(response.error);
    }
    return { status: false };
  }
  const start = async (params) => {
    const { hasRunningTimer } = await _findRunningTimer(params);
    if(!hasRunningTimer) {
      params.endsAt = null
      return await log(params);
    }
    else {
      throw new Error('You have a running timer, please stop it first.');
    }
  }
  const status = async (params) => {
    return await _findRunningTimer(params);
  }
  const get = async(params) => {
    const { timerId } = params;
    if(timerId == undefined) {
      throw new Error('timerId not set.');
    }
    const TimersQuery = `
    query timers_by_id($timerId: ID!) {
      timers_by_id(id: $timerId) {
        id
        starts_at
        ends_at
        duration
        total_duration
        notes
        task {
          tasks_id {
            task_name
          }
          projects_id {
            project_name
          }
        }
      }
    }
    `;
    const queryResponse = await graphqlClient.query(TimersQuery, { timerId });
    if(queryResponse.data != undefined && queryResponse.data.timers_by_id != undefined) {
      return { status: true, data: queryResponse.data.timers_by_id };
    }
    else {
      throw new Error(queryResponse.error);
    }
    return { status: false };
  }
  const update = async(params) => {
    // TODO: Check user when updating timer entry
    const { timerId, data } = params;
    if(timerId == undefined) throw new Error('Required parameters not set.');
    const EditTimerMutation = `
      mutation update_timers_item($timerId: ID!, $taskComment: String, $duration: Int, $totalDuration: Int, $startsAt: Date, $endsAt: Date, $totalCost: Float, $totalDurationInHours: Float) {
        update_timers_item(id: $timerId, data: {total_cost: $totalCost, notes: $taskComment, total_duration: $totalDuration, duration: $duration, total_duration_in_hours: $totalDurationInHours, starts_at: $startsAt, ends_at: $endsAt}) {
          id
          total_duration
          total_duration_in_hours
          total_cost
          task {
            tasks_id {
              task_name
            }
            projects_id {
              project_name
            }
          }
        }
      }
    `;
    const response = await graphqlClient.mutation(EditTimerMutation, {
      timerId: +timerId,
      totalDuration: +data.totalDuration,
      totalDurationInHours: +data.totalDurationInHours,
      duration: +data.duration,
      totalCost: +data.totalCost,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      taskComment: data.taskComment
    });
    if(response.error == undefined) {
      return { status: true, data: response.data.update_timers_item };
    }
    else {
      throw new Error(response.error);
    }
    return { status: false };
  }
  const restart = async(params) => {
    const { hasRunningTimer } = await _findRunningTimer(params);
    if(!hasRunningTimer) {
      const { timerId } = params;
      const timer = await findTimerById({ timerId });
      if(timer == undefined) throw new Error('Timer not found.');
      return await update({ timerId, data: { duration: (timer.total_duration || 0), startsAt: DateTime.now(), endsAt: null }});
    }
    else {
      throw new Error('You have a running timer, please stop it first.');
    }
  }
  const findTimerById = async(params) => {
    const { timerId } = params;
    if(timerId == undefined) throw new Error('Required parameters not set.');
    const TimerQuery = `
      query timers_by_id($timerId: ID!) {
        timers_by_id(id: $timerId) {
          id
          starts_at
          ends_at
          duration
          total_duration
          task {
            tasks_id {
              task_name
              id
            }
            projects_id {
              id
              project_name
              metadata
            }
          }
          user_id {
            email
          }
        }
      }
    `;
    const response = await graphqlClient.query(TimerQuery, { timerId });
    return response?.data?.timers_by_id || undefined;
  }
  const findTimersByUserId = async(params) => {
    const { startsAt, endsAt, externalUserId, email, did, userId } = params;
    if(startsAt == undefined || endsAt == undefined || (userId == undefined || externalUserId == undefined && did == undefined && email == undefined)) {
      throw new Error('Required parameters not set.');
    }
    const actualUserId = await Users({ graphqlClient }).findUserId({ externalUserId, email, did, userId });
    const TimersQuery = `
    query Timers {
      timers(
      filter: {starts_at: {_between: ["${startsAt}", "${endsAt}"]}, user_id: { id: {_eq: "${actualUserId}"}}}
      ) {
        id
        duration
        total_duration
        starts_at
        ends_at
        task {
          id
          tasks_id {
            task_name
          }
          projects_id {
            id
            project_name
          }
        }
        notes
      }
    }
    `;
    const response = await graphqlClient.query(TimersQuery);
    return response?.data?.timers || [];
  }
  const findTimersByProjectId = async(params) => {
    const { projectId, startsAt, endsAt } = params;
    if(projectId == undefined || startsAt == undefined || endsAt == undefined) throw new Error('Missing arguments');
    const TimersByProjectIdQuery = `
    query timers {
      timers(filter: {task: {projects_id: {id: {_eq: ${projectId}}}}, starts_at: {_between: ["${startsAt}", "${endsAt}"]}} sort: "starts_at") {
        id
        user_id {
          first_name
          last_name
          email
        }
        total_duration
        total_duration_in_hours
        total_cost
        starts_at
        ends_at
        task {
          projects_id {
            id
            project_name
          }
          tasks_id {
            id
            task_name
          }
        }
      }
    }
    `;
    const response = await graphqlClient.query(TimersByProjectIdQuery);
    return response?.data?.timers || [];
  }
  const findTimersByDate = async(params) => {
    const { startsAt, endsAt } = params;
    if(startsAt == undefined && endsAt == undefined) throw new Error('Missing arguments');
    const TimersQuery = `
      query timers {
        timers(filter: starts_at: {_between: ["${startsAt}", "${endsAt}"]}} sort: "starts_at") {
          id
          user_id {
            email
            slack_user_id
            id
          }
          duration
          starts_at
          task {
            projects_id {
              metadata
            }
          }
        }
      }
    `;
    const response = await graphqlClient.query(TimersQuery);
    return response?.data?.timers || [];
  }
  const findTimersByNoEndDate = async(params) => {
    const { startsBefore } = params;
    if(startsBefore == undefined) throw new Error('Missing arguments');
    const TimersQuery = `
      query timers($startsBefore: String!) {
        timers(filter: {ends_at: {_null: true}, starts_at: {_lte: $startsBefore}}) {
          id
          user_id {
            email
            slack_user_id
            id
          }
          duration
          starts_at
          task {
            projects_id {
              metadata
            }
          }
        }
      }
    `;
    const response = await graphqlClient.query(TimersQuery, { startsBefore });
    return response?.data?.timers || [];
  }
  return { 
    start, 
    stop, 
    log, 
    status, 
    list, 
    remove, 
    get, 
    update, 
    restart,
    findTimerById,
    findTimersByProjectId, 
    findTimersByUserId,
    findTimersByDate,
    findTimersByNoEndDate 
  }
}

export { Timers }