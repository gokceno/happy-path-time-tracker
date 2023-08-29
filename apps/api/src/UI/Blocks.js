import { DateTime } from 'luxon';
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
	const { id = '', label = '', actionId = '', initialValue = '', isMultiline = false, type = 'plain_text_input', isDecimalAllowed = true } = params;
	return {
		"type": "input",
		"block_id": id,
		"element": {
			"type": type,
			"action_id": actionId,
			"initial_value": initialValue,
			...(type == 'plain_text_input' && { "multiline": isMultiline }),
			...(type == 'number_input' && { "is_decimal_allowed": isDecimalAllowed })
		},
		"label": labelElement({ label })
	}
}

const datePicker = (params = {}) => {
	const { id = '', actionId = '', label = 'Select a date', placeholder = 'Select a date', initialDate = DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).toISODate() } = params;
	return {
		"type": "input",
		"block_id": id,
		"element": {
			"type": "datepicker",
			"action_id": actionId,
			"initial_date": initialDate,
			"placeholder": {
				"type": "plain_text",
				"text": placeholder,
				"emoji": true
			},
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

const timeEntriesList = (params) => {
	const { blocks } = params;
	if(blocks.length) {
		return [
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: "Below is a list of your time entries ⌛️",
			},
		},
		{
			type: "divider",
		},
		...blocks.flat(),
		];
	}
	return [{
		type: "section",
		text: {
			type: "mrkdwn",
			text: "You don't have any time entries ⌛️ Feel free to close this window 👍",
		},
	}];
} 

export { staticSelect, input, toggle, timeEntriesList, datePicker };