const { DateTime, Duration } = require('luxon');

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

const timeEntry = (params = {}) => {
	return {
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": `*${params.item.task.projects_id.project_name} — ${params.item.task.tasks_id.task_name}*.\n${params.item.notes}`
		},
	}
}

// TODO: Timezone'lar hatalı o nedenle saatler yanlış gözüküyor.
const timerDisplay = (params = {}) => {
	const timerEndTime = params.item.ends_at != undefined ? DateTime.fromISO(params.item.ends_at).toLocaleString(DateTime.TIME_SIMPLE) : '(still running)';
	return {
		"type": "context",
		"elements": [
			{
				"type": "mrkdwn",
				"text": `*Logged time:* ${Duration.fromObject({ minutes: params.item.duration }).toHuman({ unitDisplay: 'short' })}`
			},
			{
				"type": "mrkdwn",
				"text": "|"
			},
			{
				"type": "mrkdwn",
				"text": `*From:* ${DateTime.fromISO(params.item.starts_at).toLocaleString(DateTime.TIME_SIMPLE)} *to* ${timerEndTime}`
			}
		]
	};
}

module.exports = { label, title, submit, timerDisplay, timeEntry };