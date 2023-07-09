import dotenv from 'dotenv';
import { SlackClient as slackClientApp } from '@happy-path/slack-client';

dotenv.config();

const Notification = ({ slackId, email }) => {
	let _slackRecipients = [];
	let _emailRecipients = [];
	const channels = ['slack', 'email'];
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

	const send = async({ body, subject }) => {
		_slackRecipients.forEach(slackId => {
			_slack({ slackId, message: body });
		});
		_emailRecipients.forEach(email => {
			_log({ email });
		});
	}

	if(slackId != undefined) _slackRecipients.push(slackId);
	if(email != undefined) _emailRecipients.push(email);

	return { send, channels }
}

export { Notification }