
# Happy Path Time Tracker
Happy Path is a time tracker app built for Slack. It users [Directus](http://directus.io/) as its backend and [Slack's Bolt Framework](https://slack.dev/bolt-js/concepts) for the frontend. 

Currently it's work-in-progress (although usable), and single-tenant, so use it at your own risk and expect to receive breaking updates.

## Running

### Running Locally
A `docker-compose.yml` file is present in the repo, give `docker-compose up -d` command to start the stack locally. You can find the port numbers in the mentioned YML file.

Once started use the `docker-compose logs --follow` command to see the logs.

### Running for Development
To run for development, you need to start the API and the Slack handler separately. Start the Directus API by:

1. Run  `docker-compose build directus`  to build the container.
2. Run `docker-compose start directus` to start the API.

Then run `turbo start` to start the Slack handler. 

To try it out locally, you'll need to update your Slack App configuration to point to your local setup, you can expose your local servers by [Ngrok](http://ngrok.com/) or [Tailscale Funnel](https://tailscale.com/blog/introducing-tailscale-funnel/).

### Releasing
Issue `yarn release` in your project folder to create a new release, it works best if you use [conventional commits](http://conventionalcommits.org/) in your commit messages.

### Migrations 
Backend uses [Directus](http://directus.io/) for APIs and data handling. Please [consult the documentation](https://docs.directus.io/self-hosted/cli.html#migrate-schema-to-a-different-environment) for migrations.

Snapshots reside under `snapshots/` directory.

## Installation

### Add to Slack
Add to Slack by creating a new App for your workspace, unfortunately it's not available on the Slack Marketplace, yet. Steps:

1. (Optional) Create a new workspace with Slack, unless you want install it on an existing workspace.
2. Click on "Create new app" button on the [your apps page](https://api.slack.com/apps). Make sure you select the correct workspace. In the free plan, Slack allows max number of 10 apps, you can [remove unused apps](https://slack.com/help/articles/360003125231-Remove-apps-and-custom-integrations-from-your-workspace) to add Happy Path.
3. When presented, select "from an app manifest" option, to proceed with the `manifest.yml` file under `apps/api` instead of configuring manually.
4. Update the files to match your needs -- normally, changing the endpoints should be enough.
5. Hit submit to add your app, and you're done!
6. Go back to [your apps list](https://api.slack.com/apps/), and click on your newly added app.
7. Get your "signing secret" under "app credentials", and update your environment variable respectively.
8. Create a new "App-Level Token" with `connections:write` scope and update your environment variable respectively.
9. Obtain your "bot token" under "OAuth & Permissions" and update your environment variables.
10. And finally, enable sending messages to the app by checking the "Allow users to send Slash commands and messages from the messages tab" under "App Home".

Your new Slack App should be ready to go now!

You can call the slash commands (`/start`, `/list`, etc) from anywhere, but the responses will be sent by the app via private message, so it's better to initiate the conversation from there. To do that, start a direct chat with your app.

> Written with [StackEdit](https://stackedit.io/).