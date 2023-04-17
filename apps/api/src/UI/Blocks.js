const staticSelect = (params) => {
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
		"label": {
			"type": "plain_text",
			"text": label,
			"emoji": true
		}
	}
}

const input = (params) => {
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
		"label": {
			"type": "plain_text",
			"text": label,
			"emoji": true
		}
	}
}


module.exports = { staticSelect, input };