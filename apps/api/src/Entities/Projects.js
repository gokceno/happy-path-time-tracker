import { staticSelect as staticSelectFormatter } from '../Formatters.js';

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

export { Projects }