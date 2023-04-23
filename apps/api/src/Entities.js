const { DateTime } = require("luxon");
const { staticSelectFormatter, timeEntriesListFormatter } = require('./Formatters.js');

const Projects = ({ graphqlClient }) => {
  const _fetch =  async () => {
    const ProjectsQuery = `
      {
        projects {
          id
          project_name
        }
      }
    `;
    const response = await graphqlClient.query(ProjectsQuery);
    return response.data.projects;
  }
  const list = async () => {
    const projects = await _fetch();
    return projects.map(item => staticSelectFormatter({id: item.id, label: item.project_name}));
  }
  return { list }
}

const Tasks = ({ graphqlClient, queryParams }) => {
  const _fetch =  async () => {
    if (queryParams == undefined || queryParams.projectId == undefined) throw new Error('queryParams.projectId must be set');
    const ProjectsTasksQuery = `
      {
        projects_tasks(filter: {projects_id: {id: {_eq: ${queryParams.projectId}}}}) {
          tasks_id {
            task_name
            id
          }
        }
      }
    `;
    const response = await graphqlClient.query(ProjectsTasksQuery);
    return response.data.projects_tasks;
  }
  const list = async () => {
    const projectsTasks = await _fetch();
    return projectsTasks.map(item => staticSelectFormatter({ id: item.tasks_id.id, label: item.tasks_id.task_name }));
  }
  return { list }
}

const Timers = ({ graphqlClient }) => {
  const _findRunningTimer = async () => {
    const TimersQuery = `
      query Timers {
        timers(filter: {ends_at: {_null: true}}) {
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
    const response = await graphqlClient.query(TimersQuery);
    if(response.data.timers.length > 1) {
      throw new Error('Multiple running timers found, manual intervention required.');
    }
    return { 
      timer: response.data.timers[0], 
      hasRunningTimer: (response.data.timers.length == 1)
    };
  }
  const list = async (params) => { 
    const { startsAt, endsAt } = params;
    if(startsAt == undefined || endsAt == undefined) {
      throw new Error('Required parameters not set.');
    }
    // FIXME: Diğer sorgularda graphql param'ları ayrı veriyoruz ama between date tipinde kabul etmediği için içine gömdük.
    const TimersQuery = `
      query Timers {
        timers(filter: {starts_at: {_between: ["${startsAt}", "${endsAt}"]}}) {
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
    const { projectTaskId, taskComment = '', duration = 0, startsAt = DateTime.now().toString(), endsAt = DateTime.now().toString() } = params;
    if(projectTaskId == undefined) throw new Error('projectTaskId must be set');
    const CreateTimerMutation = `
      mutation Create_timers_item($duration: Int, $endsAt: Date, $startsAt: Date!, $projectTaskId: ID!, $taskComment: String) {
        create_timers_item(
          data: {duration: $duration, ends_at: $endsAt, starts_at: $startsAt, notes: $taskComment, task: {id: $projectTaskId}}
        ) {
          id
          starts_at
          ends_at
          duration
        }
      }
    `;
    const response = await graphqlClient.mutation(CreateTimerMutation, {
      duration:+duration,
      taskComment,
      startsAt,
      endsAt,
      projectTaskId
    });
    return response.data;
  }
  const stop = async () => {
    const { timer, hasRunningTimer } = await _findRunningTimer();
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
        return { status: false };
      }
    }
    return { status: false };
  }
  const start = async (params) => {
    const { hasRunningTimer } = await _findRunningTimer();
    if(!hasRunningTimer) {
      params.endsAt = null
      return await log(params);
    }
    else {
      throw new Error('You have a running timer, please stop it first.');
    }
  }
  const status = async () => {
    return await _findRunningTimer();
  }
  return { start, stop, log, status, list }
}

module.exports = { Projects, Tasks, Timers };