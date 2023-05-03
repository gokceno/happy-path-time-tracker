import { staticSelect as staticSelectFormatter } from '../Formatters.js';

const Tasks = ({ graphqlClient, queryParams }) => {
  const _fetch =  async () => {
    if (queryParams == undefined || queryParams.projectId == undefined) throw new Error('queryParams.projectId must be set');
    const ProjectsTasksQuery = `
      {
        projects_tasks(filter: {projects_id: {id: {_eq: ${queryParams.projectId}}}}) {
          id
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
    return projectsTasks.map(item => staticSelectFormatter({ id: item.id, label: item.tasks_id.task_name }));
  }
  return { list }
}

export { Tasks }