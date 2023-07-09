import dotenv from 'dotenv';
import { SlackClient as slackClientApp } from '@happy-path/slack-client';

dotenv.config();

const Notification = () => {
	let _slackRecipients = [];
	let _emailRecipients = [];

	const _slack = async ({ slackId, message }) => {
		if(slackId == undefined) return false;
		try {
			if(await slackClientApp.client.chat.postMessage({ channel: slackId, text: message })) {
				return true;
			}
			return false
		}
		catch(e) {
			_log(e);
			return false;
		}
	}
	const _email = async ({ email, message })  => {
		_log({ email, message });
	}
	const _log = (m) => {
		console.log(JSON.stringify(m));
	}

	function addRecipent(recipent, channel = 'slack') {
		if (recipent !== undefined && channel == 'slack') _slackRecipients.push(recipent);
		if (recipent !== undefined && channel == 'email') _emailRecipients.push(recipent);
		return this;
	}
	function addRecipents(recipents) {
		recipents.forEach(({ recipent, channel }) => addRecipent(recipent, channel));
		return this;
	}

	async function send({ body, subject }) {
		_slackRecipients.forEach(async (slackId) => {
			await _slack({ slackId, message: body });
		});
		_emailRecipients.forEach(email => {
			_log({ email });
		});
		return true;
	}

	return { send, addRecipents, addRecipent }
}

export { Notification }