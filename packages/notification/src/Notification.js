import dotenv from 'dotenv';
import { SlackClient as slackClientApp } from '@happy-path/slack-client';

dotenv.config();

const Notification = ({ user, users }) => {

	let _recipients = [];
	const channels = ['slack', 'email'];

	const _slack = async ({ slackId: channel, message: text }) => {
		if(channel == undefined) return false;
		try {
			if(await slackClientApp.client.chat.postMessage({ channel, text })) {
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

	const send = async({ body, subject, channels = ['slack'] }) => {
		_recipients.forEach(item => {
			_slack({ slackId: item, message: body });
		});
	}

	if(user !== undefined) _recipients.push(user);
	if(users !== undefined) _recipients = [ user, ...users ];

	return { send, channels }
}

export { Notification }