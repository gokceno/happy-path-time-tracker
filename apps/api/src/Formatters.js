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
    timerDisplayElement(params),
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "emoji": true,
            "text": "✏️ Edit"
          },
          "value": params.item.id,
          "action_id": "action__edit_time_entry"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "emoji": true,
            "text": "❌ Remove"
          },
          "value": params.item.id,
          "action_id": "action__remove_time_entry"
        }
      ]
    }
  ];
}

export { staticSelect, timeEntriesList };