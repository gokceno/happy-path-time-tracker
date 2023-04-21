const label = (params = {}) => {
	const { label = '' } = params;
	return  {
		"type": "plain_text",
		"text": label,
		"emoji": true
	}
}

const title = (params = {}) => {
	const { title = '' } = params;
	return  {
		"type": 'plain_text',
		"text": title
	}
}

const submit = (params = {}) => {
	const { label = 'Submit' } = params;
	return {
		"type": 'plain_text',
		"text": label
	}
} 

const timeEntry = () => {
	return {
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": "*Airstream Suite -- Share with another person*.\nPrivate walk-in bathroom. TV. Heating. Kitchen with microwave, basic cooking utensils, wine glasses and silverware."
		},
	}
}

const timerDisplay = () => {
	return {
		"type": "context",
		"elements": [
			{
				"type": "mrkdwn",
				"text": "*Logged time:* 00:23"
			},
			{
				"type": "mrkdwn",
				"text": "|"
			},
			{
				"type": "mrkdwn",
				"text": "*From:* 18:30 *to* 18:53"
			}
		]
	};
}

module.exports = { label, title, submit, timerDisplay, timeEntry };