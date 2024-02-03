
# Happy Path Time Tracker
Happy Path is a time tracker app built for Slack and Web. It uses [Directus](http://directus.io/) as its backend and [Slack's Bolt Framework](https://slack.dev/bolt-js/concepts) for the frontend.  On the web frontend, it uses [React&Remix](http://remix.run/).

Currently, it's a work-in-progress (although usable) and single-tenant, so use it at your own risk and expect to receive breaking updates.

## Understanding the Layout

Happy Path has 5 main components:
1. **Slack handler:** For communication with Slack; to receive and send messages, process the received commands, etc. Named "api" in the Docker Compose file.
2. **Directus API layer:** Main component for storing all the information and exposing GraphQL APIs for communication.  It's a  [Directus](http://directus.io/) backed service.
3. **Hooks handler:** Webhook handler for data transformation and enrichment.
4. **Dashboard:** A web interface for users to review and manage their time entries. Currently, starting-stoping a timer and create new time logs are possible. 
5. **Authentication:** We're using [Magic](http://magic.link/) for web authentication (for Slack no authentication is needed as it's handled by Slack). Once users are onboarded with Slack, they can log in with a magic link and start using the dashboard.

## Running

> **You need a Postgres Server!** DB layer is not included in the Compose file. Your options are:
> 1. You can add it yourself to the Compose file.
> 2. Or grab a serverless Postgres from [neon.tech](http://neon.tech/) or a similar vendor.

> **Running for the first time?** Make sure you apply the migrations to [Directus](http://directus.io/) right after you start it, [follow the migrations guide here](https://docs.directus.io/self-hosted/cli.html#applying-a-snapshot).

### Running Locally
Start by setting up the env variables in the respective repos.

A `docker-compose.yml` file is present in the repo, give `docker-compose up -d` command to start the stack locally. You can find the port numbers in the mentioned YML file.

Once started use the `docker-compose logs --follow` command to see the logs.

### Running for Development
To run for development, you need to start the API and Slack and hook handlers separately (as Directus doesn't require any development in its end). Start the Directus API by:

1. Run  `docker-compose build directus`  to build the container.
2. Run `docker-compose create directus` to create the container.
3. Run `docker-compose start directus` to start the API.

Then run `turbo start` to start the Slack and hooks handler.

To try it out locally, you'll need to update your Slack App configuration to point to your local setup, you can expose your local servers by [Ngrok](http://ngrok.com/) or [Tailscale Funnel](https://tailscale.com/blog/introducing-tailscale-funnel/).

### Releasing
Issue `yarn release` in your project folder to create a new release, it works best if you use [conventional commits](http://conventionalcommits.org/) in your commit messages.

### Migrations 
Backend uses [Directus](http://directus.io/) for APIs and data handling. Please [consult the documentation](https://docs.directus.io/self-hosted/cli.html#migrate-schema-to-a-different-environment) for migrations.

**Creating a snapshot:**

1. Go to `apps/directus` in the command-line
2. Run `yarn snapshot:create`
3. Commit the snapshot. Keep in mind that the snapshot will not be processed automatically among environments.

Snapshots reside under `snapshots/` directory.

### Deploying for Production

You can use the `docker-stack.yml` file for production deploys. `docker stack` is a Docker Swarm command hence you'll need a one. You can easily deploy using the following instructions.

#### Prerequisites
1. Set up a DB server and obtain the CA Certificate (on DigitalOcean, it's needed, may vary for other vendors).
2. Prepare the `.env` files; currently Stack file requires an env for each of its services.
3. Update the `Caddyfile` accordingly to match your hostname, etc. Make sure to point your DNS before as it'll try to obtain an SSL for you.

#### Setting up
1. Deploy the entire project or copy the `.caddy` directory, the `.env` files and the `docker-stack.yml` file to your new server.
2. Start your Swarm with `docker swarm init` if you have more than one network adapter, you may need to use `--advertise-addr` In our case Tailscale was installed and caused an issue.
3. Deploy the stack with `docker stack deploy --compose-file docker-stack.yaml happypath` command.

You can observe your setup with `docker stack ps happypath` or view the logs for each service with `docker service logs <service-name> -f`

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

## Using the App

### Adding Billable's

Platfrom is able to calculate the billable for each time entry, this is done through configuring the "metadata". There are various metadata in the platform, namely;

- The default metadata, which is effective platfrom-wide
- Project-specific metadata

During processing these two are concatonated allowing to use YAML anchors. A common use case is configuring the user groups in the default metadata (as it's a static) and using them within the project-specific metadata through YAML anchors.

> 💡 Keep in mind that billable's are always calculated through project metadata, the default metadata is supplied for convenience.

**A typical project metadata**

Below you'll see the entire project metadata which you can configure to produce the billables.

Basically, you define the user groups first, define the prices and add user groups to the prices along with a validity date.

```yaml
groups:
  - sr. developers:
      members:
        - U02H92T46R4
  - jr. developers:
      members:
        - U02H1476563
prices:
  - price: 200
    valid_until: 2025-01-01
    groups:
      - jr. developers
      - sr. developers
```
However, in real-life we can divide this data into two for easy-of-use:

**Default metadata:**

```yaml
default_groups: &default_groups
  - sr. developers:
      members:
        - U03CP3X0Y
  - project managers:
      members:
        - U039LBY4K
        - UKG5RT3KQ
default_prices: &default_prices
  - price: 100
    valid_until: 2025-01-01
    groups:
      - sr. developers
      - project managers
  - price: 200
    valid_until: 2025-01-01
    groups:
      - jr. developers
      - jr. qa
```

and reference these values with anchors. For instance a default project would look like:

```yaml
groups: *default_groups
prices: *default_prices
```
or we can keep the groups and override the prices:

```yaml
groups: *default_groups
prices:
  - price: 0
    valid_until: 2025-01-01
    groups:
      - sr. developers
      - project managers
      - jr. developers
      - jr. qa
```

### Adding Price Modifiers

Happy Path has the following price modifiers, which are run during billable calculation:

- **noLessThanOneHour:** Rounds a time entry to one hour (60 minutes) if it's below 60 minutes. Useful if you charge your clients minimum of one hour.
- **weekends :** Multiples the billable rate with 1.5 if the work is done during saturday or sunday. If a work started or ended in the weekend it's considered as a weekend job regardless of how much of it done during weekend.
- **overtime:** Multiplies the billable rate with 1.5 if the work is done between hours 18:00 in the evening and 08:00 in the morning.

You can call these modifiers per project by using the following in the metadata:

```yaml
price_modifiers:
  - "noLessThanOneHour"
  - "weekends"
  - "overtime"
```

### Configuring Reports

Happy Path is able to produce PDF reports for interested parties. Reports are configurable for projects by the following directives in the project metadata:

```yaml
reports:
  currency: USD
  recipients:
    - <email_address>
  excluded_tasks:
    - <task_name>
```

Basically;

- Currency displayed in the reports are configurable; please note that this is not mentioned elsewhere, for example, if you're to build a dashboard within Directus, you still need to implement this value there.
- You can define the report recipients with their email addresses. Reports are not downloadable; they are produced asyncronously and e-mailed to you when done.
- You can exclude certain task types from your reports, when used a task type is tracked and calculated but not included in the reports. Useful when certain task types are not billable.

> Written with [StackEdit](https://stackedit.io/).