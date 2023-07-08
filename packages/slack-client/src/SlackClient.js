import dotenv from 'dotenv';
import bolt from '@slack/bolt';

dotenv.config();

const { App, LogLevel } = bolt;
const SlackClient = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.INFO,
  socketMode: false
});

export { SlackClient };