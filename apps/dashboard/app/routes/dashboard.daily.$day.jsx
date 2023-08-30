import { Outlet, useLoaderData, useParams, useRevalidator } from '@remix-run/react';
import { useEffect } from 'react';
import { json, redirect } from '@remix-run/node';
import { DateTime } from 'luxon';
import * as Dialog from '@radix-ui/react-dialog';
import { Frontend as Client } from '@happy-path/graphql-client';
import { auth as authCookie } from '~/utils/cookies.server';
import ClientContainer from "~/components/client-container";
import SectionHeader from "~/components/section-header";
import NoTimeEntry from "~/components/no-time-entry";
import StartNewTimerButton from "~/components/start-new-timer-button.jsx";

const TimersQuery = `
  query Timers($startsAt: String!, $endsAt: String!) {
    timers(startsAt: $startsAt, endsAt: $endsAt) {
      id
      startsAt
      endsAt
      duration
      totalDuration
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
  const { token } = await authCookie.parse(request.headers.get('cookie')) || {};
  if(token == undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  const { day: onDate } = params;
  const response = await Client({ token }).query(TimersQuery, {
    startsAt: DateTime.fromISO(onDate, { zone: process.env.TIMEZONE || 'UTC' }).startOf('day').toUTC().toISO(),
    endsAt: DateTime.fromISO(onDate, { zone: process.env.TIMEZONE || 'UTC' }).endOf('day').toUTC().toISO(),
  });
  // TODO: not all errors are 403
  if(response.error != undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  return json({
    url: process.env.API_GRAPHQL_URL,
    timers: response?.data?.timers || [],
    culture: process.env.LOCALE_CULTURE || 'en-US',
    timezone: process.env.TIMEZONE || 'UTC',
    revalidateDateEvery: process.env.REVALIDATE_DATA_EVERY || 60
  });
};

export default function DashboardDailyDayRoute() {
  const { day } = useParams();
  const { revalidate } = useRevalidator();
  const { timers, culture, timezone, revalidateDateEvery } = useLoaderData();
  const totalDuration = timers.reduce((acc, timer) => (acc + timer.totalDuration), 0);
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

  return (
    <div className="self-stretch flex flex-col items-start justify-start gap-[16px] text-left text-lgi text-primary-dark-night font-primary-small-body-h5-medium">
      <SectionHeader sectionTitle={DateTime.fromISO(day).isValid ? DateTime.fromISO(day).setLocale(culture).toLocaleString(DateTime.DATE_MED) : 'Logs'} totalDuration={totalDuration}/>
      {projects.map((project) => (
        <ClientContainer key={project} clientName={project} timers={timers} timezone={timezone}/>
      ))}
      {!timers.length > 0 ? 
        <NoTimeEntry/>
        : ''
      }
      <StartNewTimerButton 
        to={`/dashboard/daily/${day}/projects`} 
        hasRunningTimer={timers.filter(timer => timer.endsAt == undefined).length == 1}
        isToday={DateTime.fromISO(day, { zone: timezone }).toISODate() == DateTime.local({ zone: timezone }).toISODate() }
      />
      <Outlet/>
    </div>
  );
}
