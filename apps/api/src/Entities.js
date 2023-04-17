const { staticSelectFormatter } = require('./Formatters.js');

const Projects = () => {
  fetch = () => {
    return [1,2,3];
  }
  return {
    list: () => {
      return fetch().map(item => staticSelectFormatter(item));
    }
  }
}

const Tasks = () => {
  fetch = () => {
    return [1,2,3];
  }
  return {
    list: () => {
      return fetch().map(item => staticSelectFormatter(item));
    }
  }
}

module.exports = { Projects, Tasks };