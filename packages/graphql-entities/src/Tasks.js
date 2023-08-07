// TODO: Should move queryParams to list or _fetch
const Tasks = ({ client, queryParams }) => {
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
    const response = await client.query(ProjectsTasksQuery);
    return response.data.projects_tasks;
  }
  const list = async (formatter) => {
    const projectsTasks = await _fetch();
    if(formatter !== undefined) {
      return projectsTasks.map(item => formatter({ id: item.id, label: item.tasks_id.task_name }));
    }
    return projectsTasks;
  }
  return { list }
}

export { Tasks }