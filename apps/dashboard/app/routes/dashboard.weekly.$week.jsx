import { useLoaderData, useParams, useRevalidator } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { jwtVerify } from 'jose';
import { Frontend as GraphQLClient } from '@happy-path/graphql-client';
import { Timers } from '@happy-path/graphql-entities';
import ClientContainer from '../components/client-container';
import { DateTime } from 'luxon';
import DayHeader from '../components/day-header';
import NoTimeEntry from '../components/no-time-entry';
import SectionHeader from '../components/section-header';
import { auth as authCookie, email as emailCookie } from '~/utils/cookies.server';
import { useEffect } from 'react';

export const loader = async ({ request, params }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  const email = await emailCookie.parse(request.headers.get('cookie'));
  try {
    const secret = new TextEncoder().encode(process.env.DIRECTUS_JWT_SECRET);
    await jwtVerify(token, secret);
  } catch (e) {
    return redirect('/logout');
  }
  const { week: onDate } = params;

  const client = GraphQLClient({
    token,
    url: process.env.API_DIRECTUS_URL + '/graphql/',
  });

  const timers = (
    await Timers({
      client,
      timezone: process.env.TIMEZONE || 'UTC',
    }).findTimersByUserId({
      startsAt: DateTime.fromISO(onDate, { zone: 'UTC' })
        .startOf('day')
        .toUTC()
        .toISO(),
      endsAt: DateTime.fromISO(onDate, { zone: 'UTC' })
        .plus({ days: 6 })
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
    culture: process.env.LOCALE_CULTURE || 'en-US',
    timezone: process.env.TIMEZONE || 'UTC',
    revalidateDateEvery: process.env.REVALIDATE_DATA_EVERY || 60,
  });
};

export default function DashboardWeeklyWeekRoute() {
  const { week: onDate } = useParams();
  const { timers, culture, timezone, revalidateDateEvery } = useLoaderData();
  const { revalidate } = useRevalidator();
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
  const days = timers.reduce((acc, timer) => {
    if (!acc.includes(DateTime.fromISO(timer.startsAt).toISODate())) {
      acc.push(DateTime.fromISO(timer.startsAt).toISODate());
    }
    return acc;
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      revalidate();
    }, revalidateDateEvery * 1000);
    return () => clearInterval(interval);
  });
  return (
    <div className="self-stretch flex flex-col items-start justify-start gap-[16px] text-left text-lgi text-primary-dark-night font-primary-small-body-h5-medium">
      <SectionHeader
        sectionTitle={`${DateTime.fromISO(onDate).toFormat(
          'dd'
        )} - ${DateTime.fromISO(onDate)
          .plus({ weeks: 1 })
          .setLocale(culture)
          .toFormat('dd LLL')}`}
        totalDuration={totalDuration}
      />
      {days.map((day) => (
        <div
          key={day}
          className="flex flex-col gap-[16px]"
        >
          <DayHeader
            key={day}
            title={DateTime.fromISO(day)
              .setLocale(culture)
              .toFormat('EEEE, dd LLL')}
          />
          {projects.map((project) => (
            <ClientContainer
              timezone={timezone}
              key={project}
              clientName={project}
              timers={timers.filter(
                (timer) =>
                  DateTime.fromISO(timer.startsAt).toISODate() == day &&
                  timer.project.name === project
              )}
            />
          ))}
        </div>
      ))}
      {!timers.length > 0 ? <NoTimeEntry /> : ''}
    </div>
  );
}
