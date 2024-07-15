import { useEffect } from 'react';
import { DateTime } from 'luxon';
import { jwtVerify } from 'jose';
import {
  Outlet,
  useLoaderData,
  useParams,
  useRevalidator,
} from '@remix-run/react';
import {
  auth as authCookie,
  email as emailCookie,
  recentProjectTasks as recentProjectTasksCookie,
} from '~/utils/cookies.server';
import { json, redirect } from '@remix-run/node';
import { Frontend as GraphQLClient } from '@happy-path/graphql-client';
import { Timers } from '@happy-path/graphql-entities';
import ClientContainer from '~/components/client-container';
import NoTimeEntry from '~/components/no-time-entry';
import SectionHeader from '~/components/section-header';
import StartNewTimerButton from '~/components/start-new-timer-button.jsx';

export const loader = async ({ request, params }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  const email = await emailCookie.parse(request.headers.get('cookie'));
  try {
    const secret = new TextEncoder().encode(process.env.DIRECTUS_JWT_SECRET);
    await jwtVerify(token, secret);
  } catch (e) {
    return redirect('/logout');
  }
  const { day: onDate } = params;
  const recentProjectTasks =
    (await recentProjectTasksCookie.parse(request.headers.get('cookie'))) || {};

  const client = GraphQLClient({
    token,
    url: process.env.API_DIRECTUS_URL + '/graphql/',
  });

  const timers = (
    await Timers({ client }).findTimersByUserId({
      startsAt: DateTime.fromISO(onDate, {
        zone: process.env.TIMEZONE || 'UTC',
      })
        .startOf('day')
        .toUTC()
        .toISO(),
      endsAt: DateTime.fromISO(onDate, { zone: process.env.TIMEZONE || 'UTC' })
        .endOf('day')
        .toUTC()
        .toISO(),
      email,
    })
  ).map((item) => ({
    id: item.id,
    startsAt: item.starts_at,
    endsAt: item.ends_at,
    duration: item.duration,
    totalDuration: item.total_duration,
    notes: item.notes,
    relations: item.relations,
    project: {
      id: item.task.projects_id.id,
      name: item.task.projects_id.project_name,
    },
    task: {
      id: item.task.id,
      name: item.task.tasks_id.task_name,
    },
  }));

  return json({
    timers,
    recentProjectTasks: recentProjectTasks || [],
    url: process.env.API_GRAPHQL_URL,
    culture: process.env.LOCALE_CULTURE || 'en-US',
    timezone: process.env.TIMEZONE || 'UTC',
    revalidateDateEvery: process.env.REVALIDATE_DATA_EVERY || 60,
  });
};

export default function DashboardDailyDayRoute() {
  const { day } = useParams();
  const { revalidate } = useRevalidator();
  const { timers, culture, timezone, revalidateDateEvery, recentProjectTasks } =
    useLoaderData();
  const totalDuration = timers.reduce(
    (acc, timer) => acc + timer.totalDuration,
    0
  );
  const projects = timers.reduce((acc, timer) => {
    if (!acc.includes(timer.project.name)) {
      acc.push(timer.project.name);
    }
    return acc;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      revalidate();
    }, revalidateDateEvery * 1000);
    return () => clearInterval(interval);
  });

  const sortRecentProjectsByCount = (arr) =>
    arr.sort((a, b) => b.count - a.count).slice(0, 3);

  const isToday =
    DateTime.fromISO(day, { zone: timezone }).toISODate() ==
    DateTime.local({ zone: timezone }).toISODate();

  return (
    <div className="self-stretch flex flex-col items-start justify-start gap-[16px] text-left text-lgi text-primary-dark-night font-primary-small-body-h5-medium">
      <SectionHeader
        sectionTitle={
          DateTime.fromISO(day).isValid
            ? DateTime.fromISO(day)
                .setLocale(culture)
                .toLocaleString(DateTime.DATE_MED)
            : 'Logs'
        }
        totalDuration={totalDuration}
      />
      {projects.map((project) => (
        <ClientContainer
          key={project}
          clientName={project}
          timers={timers}
          timezone={timezone}
        />
      ))}
      {!timers.length > 0 ? <NoTimeEntry /> : ''}

      <div className="flex flex-col justify-start items-start">
        {recentProjectTasks?.length && (
          <p className="font-medium text-base my-2">
            Brand New <span className="text-4xl">🤘🏻</span>
          </p>
        )}
        <StartNewTimerButton
          to={`/dashboard/daily/${day}/projects`}
          hasRunningTimer={
            timers.filter((timer) => timer.endsAt == undefined).length == 1
          }
          isToday={isToday}
        />

        {recentProjectTasks?.length && (
          <p className="font-medium text-base my-2">
            Recent <span className="text-4xl">👇🏻</span>
          </p>
        )}
        {recentProjectTasks &&
          recentProjectTasks?.length > 0 &&
          sortRecentProjectsByCount(recentProjectTasks).map((projectTask) => (
            <StartNewTimerButton
              key={projectTask.taskId}
              to={`/dashboard/daily/${day}/${projectTask.projectId}/${projectTask.taskId}/start`}
              additionalTag={`${projectTask.projectName} / ${projectTask.taskName}`}
              hasRunningTimer={
                timers.filter((timer) => timer.endsAt == undefined).length == 1
              }
              isToday={isToday}
              projectTask={projectTask}
            />
          ))}
      </div>

      <Outlet />
    </div>
  );
}
