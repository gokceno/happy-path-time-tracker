const { staticSelectFormatter } = require('./Formatters.js');

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

const Timers = () => {
  const _fetch = async () => {}
  const list = async () => {}
  const start = async (params) => {
    const { projectTaskId, taskComment = '' } = params;
    if(projectTaskId == undefined) throw new Error('projectTaskId must be set');
  }
  const stop = async () => {}
  const log = async (params) => {
    const { projectTaskId, startsAt = Date(), endsAt = Date(), duration = 0, taskComment = '' } = params;
    if(projectTaskId == undefined) throw new Error('projectTaskId must be set');
  }
  return { start, stop, log }
}

module.exports = { Projects, Tasks, Timers };