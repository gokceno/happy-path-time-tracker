const dotenv = require('dotenv');
const { App, LogLevel } = require('@slack/bolt');
const { setTimerDetails } = require('./src/Views.js');
const { selectProjectId } = require('./src/Actions.js');
const { start, stop, status, list } = require('./src/Commands.js');

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.INFO,
  socketMode: false
});

app.command('/start', start);
app.action('start__action__select_project_id', selectProjectId);
app.view('start__view__set_timer_details', setTimerDetails);

app.command('/stop', stop);

app.command('/show', status);

app.command('/list', list);

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();



