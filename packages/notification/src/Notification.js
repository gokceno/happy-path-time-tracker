import dotenv from 'dotenv';
import { SlackClient as slackClientApp } from '@happy-path/slack-client';
import { createRequire } from "module";

dotenv.config();

const require = createRequire(import.meta.url);

const MailJet = require('node-mailjet');

const mailjet = MailJet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE,
);

const Notification = () => {
	let _slackRecipients = [];
	let _emailRecipients = [];
	const _emailFrom = {
		From: {
			Email: process.env.MJ_FROM_EMAIL,
			Name: process.env.MJ_FROM_NAME
		}
	};

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
		const request = mailjet
			.post('send', { version: 'v3.1' })
			.request({
				Messages: [
					{
						..._emailFrom,
						To: [
							{
								Email: email,
							}
						],
						TemplateID: process.env.MJ_TEMPLATE_ID,
				    TemplateLanguage: true,
						Subject: subject,
						Variables: {
    					message
    				}
					}
				]
			}).then((result) => {
				_log(result.body)
			}).catch((err) => {
				_log(err.statusCode);
			});
	}
	const _log = (m) => {
		console.log(JSON.stringify(m));
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