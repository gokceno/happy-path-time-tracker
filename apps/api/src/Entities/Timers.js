import { DateTime } from 'luxon';
import { timeEntriesList as timeEntriesListFormatter } from '../Formatters.js';

const Timers = ({ graphqlClient }) => {
  const _findRunningTimer = async (params) => {
    const { externalUserId } = params;
    if(externalUserId == undefined) throw new Error('externalUserId must be set');
    const TimersQuery = `
      query Timers($externalUserId: String!) {
        timers(filter: {ends_at: {_null: true}, externalUserId: {_eq: $externalUserId}}) {
          id
          duration
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
    const response = await graphqlClient.query(TimersQuery, { externalUserId });
    if(response.data.timers.length > 1) {
      throw new Error('Multiple running timers found, manual intervention required.');
    }
    return { 
      timer: response.data.timers[0], 
      hasRunningTimer: (response.data.timers.length == 1)
    };
  }
  const list = async (params) => { 
    const { startsAt, endsAt, externalUserId } = params;
    if(startsAt == undefined || endsAt == undefined) {
      throw new Error('Required parameters not set.');
    }
    // FIXME: Diğer sorgularda graphql param'ları ayrı veriyoruz ama between date tipinde kabul etmediği için içine gömdük.
    const TimersQuery = `
      query Timers {
        timers(
        filter: {starts_at: {_between: ["${startsAt}", "${endsAt}"]}, externalUserId: {_eq: "${externalUserId}"}}
        ) {
          id
          duration
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
          notes
        }
      }
    `;
    const response = await graphqlClient.query(TimersQuery);
    if(response.data != undefined) {
      return response.data.timers.map(item => timeEntriesListFormatter({item}));
    }
    return [];
  }
  const log = async (params) => {
    const { projectTaskId, externalUserId, taskComment = '', duration = 0, startsAt = DateTime.now().toString(), endsAt = DateTime.now().toString() } = params;
    if(projectTaskId == undefined || externalUserId == undefined) {
      throw new Error('projectTaskId and externalUserId must be set');
    }
    const CreateTimerMutation = `
      mutation Create_timers_item($externalUserId: String!, $duration: Int, $endsAt: Date, $startsAt: Date!, $projectTaskId: ID!, $taskComment: String) {
        create_timers_item(
          data: {externalUserId: $externalUserId, duration: $duration, ends_at: $endsAt, starts_at: $startsAt, notes: $taskComment, task: {id: $projectTaskId}}
        ) {
          id
          starts_at
          ends_at
          duration
        }
      }
    `;
    const response = await graphqlClient.mutation(CreateTimerMutation, {
      externalUserId,
      duration:+duration,
      projectTaskId: +projectTaskId,
      taskComment,
      startsAt,
      endsAt
    });
    return response.data;
  }
  const stop = async (params) => {
    const { timer, hasRunningTimer } = await _findRunningTimer(params);
    if(hasRunningTimer) {
      const StopTimerMutation = `
        mutation Update_timers_item($timerId: ID!, $endsAt: Date!) {
          update_timers_item(id: $timerId, data: {ends_at: $endsAt}) {
            duration
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
        logger.error(response.error);
      }
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
  return { start, stop, log, status, list }
}

export { Timers }