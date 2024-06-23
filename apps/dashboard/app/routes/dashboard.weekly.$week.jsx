import { Outlet, useLoaderData, useParams, useRevalidator } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';

import { Frontend as Client } from '@happy-path/graphql-client';
import ClientContainer from '../components/client-container';
import { DateTime } from 'luxon';
import DayHeader from '../components/day-header';
import NoTimeEntry from '../components/no-time-entry';
import SectionHeader from '../components/section-header';
import { auth as authCookie } from '~/utils/cookies.server';
import { useEffect } from 'react';

const TimersQuery = `
  query Timers($startsAt: String!, $endsAt: String!) {
    timers(startsAt: $startsAt, endsAt: $endsAt) {
      id
      startsAt
      endsAt
      duration
      totalDuration
      notes
      relations
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
  if (token == undefined) return redirect('/login');
  const { week: onDate } = params;
  const response = await Client({ token }).query(TimersQuery, {
    startsAt: DateTime.fromISO(onDate, { zone: 'UTC' }).startOf('day').toUTC().toISO(),
    endsAt: DateTime.fromISO(onDate, { zone: 'UTC' }).plus({days: 6}).endOf('day').toUTC().toISO(),
  });
  return json({
    timers: response?.data?.timers || [],
    culture: process.env.LOCALE_CULTURE || 'en-US',
    timezone: process.env.TIMEZONE || 'UTC',
    revalidateDateEvery: process.env.REVALIDATE_DATA_EVERY || 60
  });
};

export default function DashboardWeeklyWeekRoute() {
  const { week: onDate } = useParams();
  const { timers, culture, timezone, revalidateDateEvery } = useLoaderData();
  const { revalidate } = useRevalidator();
  const totalDuration = timers.reduce((acc, timer) => (acc + timer.totalDuration), 0);
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
  }, []);
  return (
    <div className="self-stretch flex flex-col items-start justify-start gap-[16px] text-left text-lgi text-primary-dark-night font-primary-small-body-h5-medium">
    <SectionHeader sectionTitle={`${DateTime.fromISO(onDate).toFormat('dd')} - ${DateTime.fromISO(onDate).plus({ weeks: 1 }).setLocale(culture).toFormat('dd LLL')}`} totalDuration={totalDuration}/>
      {days.map((day) => (
        <div key={day} className="flex flex-col gap-[16px]">
          <DayHeader key={day} title={DateTime.fromISO(day).setLocale(culture).toFormat('EEEE, dd LLL')}/>
          {projects.map((project) => (
            <ClientContainer timezone={timezone} key={project} clientName={project} timers={timers.filter(timer => (DateTime.fromISO(timer.startsAt).toISODate() == day && timer.project.name === project))}/>
          ))}
        </div>
      ))}
      {!timers.length > 0 ? 
        <NoTimeEntry/>
        : ''
      }
    </div>
  );
}
