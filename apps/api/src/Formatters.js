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

const timeEntriesListFormatter = () => {
  return [    
    timeEntryElement(),
    timerDisplayElement()
  ];
}

module.exports = { staticSelectFormatter, timeEntriesListFormatter };