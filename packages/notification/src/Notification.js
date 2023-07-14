import dotenv from 'dotenv';
import { SlackClient as slackClientApp } from '@happy-path/slack-client';
import { Client as EmailClient } from '@happy-path/mailjet-client';

dotenv.config();

const Notification = () => {
	let _slackRecipients = [];
	let _emailRecipients = [];
	let _emailClient = EmailClient();
	const _slack = async ({ slackId, message }) => {
		try {
			if(await slackClientApp.client.chat.postMessage({ channel: slackId, text: message })) {
				return true;
			}
		}
		catch(e) {
			_log(e);
		}
		return false
	}
	const _email = async ({ email, message, subject = 'Happy Path Notification' })  => {
    _emailClient.setSubject(subject);
    _emailClient.setTemplate({
      templateId: +process.env.MJ_TEMPLATE_ID,
      vars: {
        message
      }
    });
    _emailClient.addRecipent({ email });
    _emailClient.send();
	}
	const _log = (m) => {
		console.log(m);
	}

	function addRecipent(recipent, channel = 'slack') {
		if ((recipent != undefined || recipent != null) && channel == 'slack') _slackRecipients.push(recipent);
		if ((recipent != undefined || recipent != null) && channel == 'email') _emailRecipients.push(recipent);
		return this;
	}
	function addRecipents(recipents) {
		recipents.forEach(({ recipent, channel }) => addRecipent(recipent, channel));
		return this;
	}

	async function send({ message, subject }) {
		_slackRecipients.forEach(async (slackId) => {
			await _slack({ slackId, message });
		});
		_emailRecipients.forEach(async (email) => {
			await _email({ email, message, subject });
		});
		return true;
	}

	return { send, addRecipents, addRecipent }
}

export { Notification }