import dotenv from 'dotenv';
import { createRequire } from "module";

dotenv.config();

const require = createRequire(import.meta.url);

const MailJet = require('node-mailjet');

const Client = () => {
	let _recipents = [];
	let _attachments = [];
	let _subject;
	let _templateId;
	let _templateVariables = {};
	let _htmlBody;
	let _textBody;
	let _isTemplate = false;

	const _mjApiProps = { version: 'v3.1' };
	const _emailSubjectPrefix = '[Happy Path]';
	const _emailFrom = {
		From: {
			Email: process.env.MJ_FROM_EMAIL,
			Name: process.env.MJ_FROM_NAME
		}
	};
	const _mailjetClient = MailJet.apiConnect(
	 	process.env.MJ_APIKEY_PUBLIC,
	 	process.env.MJ_APIKEY_PRIVATE,
	);

	const _log = (m) => {
		console.log(m);
	}
	const _getMessage = () => {
		let message = {
			..._emailFrom,
			To: [],
			Subject: _subject,
			TemplateLanguage: _isTemplate,
		};
		message.To = _recipents.map(recipent => ({ Email: recipent.email, Name: recipent.nameSurname }));
		if(_isTemplate) {
			message.Variables = _templateVariables || {};
			message.TemplateID = _templateId;
		}
		if(_htmlBody != undefined) message.HTMLPart = _htmlBody;
		if(_textBody != undefined) message.TextPart = _textBody;
		if(_attachments) {
			message.Attachments = _attachments.map(attachment => ({
				ContentType: attachment.contentType,
				Filename: attachment.filename,
				Base64Content: attachment.base64File
			}));
		}
		return message;
	}
	const setTemplate = (params) => {
		const { templateId, vars } = params;
		if (templateId == undefined) throw new Error('Required parameters missing.');
		_templateId = templateId;
		_templateVariables = vars;
		_isTemplate = true;
	}
	const setBody = (params) => {
		const { html, plaintext, isTemplate } = params;
		if (html == undefined && plaintext == undefined) throw new Error('Required parameters missing.');
		_htmlBody = html || '';
		_textBody = plaintext || '';
		_isTemplate = isTemplate || false;
	}
	const setSubject = (subject) => {
		if (subject == undefined) throw new Error('Required parameters missing.');
		_subject = [_emailSubjectPrefix, subject].join(' ');
	}
	const addRecipent = (params) => {
		const { email, nameSurname } = params;
		if (email == undefined) throw new Error('Required parameters missing.');
		_recipents.push({ email, nameSurname });
	}
	const addAttachment = async (params) => {
		const { base64File, filename, contentType = 'application/octet-stream', charset = 'UTF-8' } = params;
		if (base64File == undefined || filename == undefined) throw new Error('Required parameters missing.');
		_attachments.push({
			base64File,
			filename,
			contentType,
			charset
		});
	}
	const send = async () => {
		if(_templateId == undefined && (_htmlBody == undefined || _textBody == undefined)) throw new Error('Required parameters missing.');
		if(_templateId != undefined && (_htmlBody != undefined || _textBody != undefined)) throw new Error('Template ID and body cannot be set at the same time.');
		return await _mailjetClient
			.post('send', _mjApiProps)
			.request({ Messages: [_getMessage()] })
			//.then(result => _log(result))
			.catch(err => {
				_log(err);
				throw new Error(err);
			});
	}

	return {
		setTemplate,
		setBody,
		setSubject,
		addRecipent,
		addAttachment,
		send
	}
}

export { Client }