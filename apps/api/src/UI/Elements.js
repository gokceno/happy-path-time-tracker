const label = (params) => {
	const { label = '' } = params;
	return  {
		"type": "plain_text",
		"text": label,
		"emoji": true
	}
}

const title = (params) => {
	const { title = '' } = params;
	return  {
		"type": 'plain_text',
		"text": title
	}
}

module.exports = { label, title };