const { staticSelectFormatter } = require('./Formatters.js');

const Projects = ({ graphqlClient }) => {
  _fetch =  async () => {
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
  return {
    list: async () => {
      const projects = await _fetch();
      return projects.map(item => staticSelectFormatter({id: item.id, label: item.project_name}));
    }
  }
}

const Tasks = () => {
  _fetch = () => {
    return [1,2,3];
  }
  return {
    list: () => {
      return _fetch().map(item => staticSelectFormatter(item));
    }
  }
}

module.exports = { Projects, Tasks };