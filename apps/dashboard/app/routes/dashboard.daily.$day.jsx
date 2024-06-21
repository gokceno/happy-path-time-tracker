import {
  Outlet,
  useLoaderData,
  useParams,
  useRevalidator,
} from '@remix-run/react';
import {
  auth as authCookie,
  recentProjectTasks as recentProjectTasksCookie,
} from '~/utils/cookies.server';
import { json, redirect } from '@remix-run/node';

import { Frontend as Client } from '@happy-path/graphql-client';
import ClientContainer from '~/components/client-container';
import { DateTime } from 'luxon';
import NoTimeEntry from '~/components/no-time-entry';
import SectionHeader from '~/components/section-header';
import StartNewTimerButton from '~/components/start-new-timer-button.jsx';
import { useEffect } from 'react';

const TimersQuery = `
  query Timers($startsAt: String!, $endsAt: String!) {
    timers(startsAt: $startsAt, endsAt: $endsAt) {
      id
      startsAt
      endsAt
      duration
      totalDuration
      relations
      notes
      task {
        name
        id
      }
      project {
        id
        name
      }
    }
  }
`;

export const loader = async ({ request, params }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  const recentProjectTasks =
    (await recentProjectTasksCookie.parse(request.headers.get('cookie'))) || {};

  if (token == undefined) return redirect('/login');
  const { day: onDate } = params;
  const response = await Client({ token }).query(TimersQuery, {
    startsAt: DateTime.fromISO(onDate, { zone: process.env.TIMEZONE || 'UTC' })
      .startOf('day')
      .toUTC()
      .toISO(),
    endsAt: DateTime.fromISO(onDate, { zone: process.env.TIMEZONE || 'UTC' })
      .endOf('day')
      .toUTC()
      .toISO(),
  });
  return json({
    recentProjectTasks: recentProjectTasks || [],
    url: process.env.API_GRAPHQL_URL,
    timers: response?.data?.timers || [],
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
  }, []);

  const sortRecentProjectsByCount = (arr) => {
    // Sorting: Objects with higher count come first
    const sortedArray = arr.sort((a, b) => b.count - a.count);

    // Take only the first 3 objects
    const top3 = sortedArray.slice(0, 3);

    return top3;
  };

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
