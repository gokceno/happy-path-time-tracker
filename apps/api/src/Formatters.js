const { timerDisplay: timerDisplayElement, timeEntry: timeEntryElement } = require('./UI/Elements.js');

const staticSelectFormatter = ({ id, label }) => {
  return {
    "text": {
      "type": "plain_text",
      "text": `${label}`,
    },
    "value": `${id}`
  }
}

const timeEntriesListFormatter = (params) => {
  return [    
    timeEntryElement(params),
    timerDisplayElement(params)
  ];
}

module.exports = { staticSelectFormatter, timeEntriesListFormatter };