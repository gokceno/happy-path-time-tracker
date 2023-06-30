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
  return { list }
}

export { Projects }