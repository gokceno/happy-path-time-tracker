import { timerDisplay as timerDisplayElement, timeEntry as timeEntryElement } from './UI/Elements.js';

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

export { staticSelect, timeEntriesList };