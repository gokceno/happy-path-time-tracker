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
  const list = async (formatter) => {
    const projects = await _fetch();
    if(formatter !== undefined) {
      return projects.map(item => formatter({id: item.id, label: item.project_name}));  
    }
    return projects;
    
  }
  const findProjectById = async (params) => {
    const { projectId } = params;
    if(projectId == undefined) throw new Error('Missing arguments');
    const ProjectByIdQuery = `
      query project {
        projects_by_id(id: "${projectId}") {
          created_at
          updated_at
          status
          project_name
          metadata
          id
        }
      }
    `;
    const response = await graphqlClient.query(ProjectByIdQuery, { projectId });
    return response?.data?.projects_by_id || {};
  }
  return { list, findProjectById }
}

export { Projects }