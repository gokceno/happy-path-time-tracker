import { label as labelElement, timerDisplay as timerDisplayElement, timeEntry as timeEntryElement } from './Elements.js';

const staticSelect = (params = {}) => {
	const { id = '', label = '', placeholder = '', options = [], actionId = '' } = params;
	return {
		"type": "input",
		"block_id": id,
		"element": {
			"type": "static_select",
			"placeholder": {
				"type": "plain_text",
				"text": placeholder,
				"emoji": true
			},
			"options": options,
			"action_id": actionId
		},
		"label": labelElement({ label })
	}
}

const input = (params = {}) => {
	const { id = '', label = '', actionId = '', isMultiline = false, type = 'plain_text_input', isDecimalAllowed = true } = params;
	return {
		"type": "input",
		"block_id": id,
		"element": {
			"type": type,
			"action_id": actionId,
			...(type == 'plain_text_input' && { "multiline": isMultiline }),
			...(type == 'number_input' && { "is_decimal_allowed": isDecimalAllowed })
		},
		"label": labelElement({ label })
	}
}

const toggle = (params = {})  => {
	const { id = '', label = '', placeholder = '', actionId = '' } = params;
	return {
		"type": "input",
		"block_id": id,
		"element": {
			"type": "checkboxes",
			"options": [
				{
					"text": {
						"type": "plain_text",
						"text": placeholder,
						"emoji": true
					},
					"value": "true"
				}
			],
			"action_id": actionId
		},
		"label": labelElement({ label })
	}
}

// TODO: Time entries yoksa boş kalıyor.
const timeEntriesList = (params) => {
	const { blocks } = params;
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Below is a list of your time entries for *today*.",
      },
    },
    {
      type: "divider",
    },
    ...blocks.flat(),
  ];
} 

export { staticSelect, input, toggle, timeEntriesList };