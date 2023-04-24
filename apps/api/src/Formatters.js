const { timerDisplay: timerDisplayElement, timeEntry: timeEntryElement } = require('./UI/Elements.js');

const staticSelect = ({ id, label }) => {
  return {
    "text": {
      "type": "plain_text",
      "text": `${label}`,
    },
    "value": `${id}`
  }
}

const timeEntriesList = (params) => {
  return [    
    timeEntryElement(params),
    timerDisplayElement(params)
  ];
}

module.exports = { staticSelect, timeEntriesList };