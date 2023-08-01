import { Outlet, useLoaderData, useParams, useRevalidator } from '@remix-run/react';
import { useEffect } from 'react';
import { json, redirect } from '@remix-run/node';
import { Client, fetchExchange, cacheExchange } from '@urql/core';
import { DateTime } from 'luxon';
import ClientContainer from "../components/client-container";
import SectionHeader from "../components/section-header";
import NoTimeEntry from "../components/no-time-entry";

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
  const [authCookieName, authCookieValue] = (request.headers.get('Cookie') || '').split('=');
  if(authCookieValue == undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  const { day: onDate } = params;
  const GraphQLClient = new Client({
    url: process.env.API_GRAPHQL_URL,
    exchanges: [fetchExchange, cacheExchange],
    fetchOptions: () => {
      return {
        headers: { authorization: 'Bearer ' + authCookieValue },
      };
    },
  });
  const response = await GraphQLClient.query(TimersQuery, {
    startsAt: DateTime.fromISO(onDate).startOf('day').toISO(),
    endsAt: DateTime.fromISO(onDate).endOf('day').toISO(),
  });
  // TODO: not all errors are 403
  console.log('response.error', response.error);
  if(response.error != undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  return json({
    url: process.env.API_GRAPHQL_URL,
    timers: response?.data?.timers || [],
    culture: process.env.LOCALE_CULTURE || 'en-US',
    tinezone: process.env.TIMEZONE || 'UTC',
    revalidateDateEvery: process.env.REVALIDATE_DATA_EVERY || 60
  });
};

export default function DashboardDailyDayRoute() {
  const params = useParams();
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
      <SectionHeader sectionTitle={DateTime.fromISO(params.day).isValid ? DateTime.fromISO(params.day).setLocale(culture).toLocaleString(DateTime.DATE_MED) : 'Logs'} totalDuration={totalDuration}/>
      {projects.map((project) => (
        <ClientContainer key={project} clientName={project} timers={timers} timezone={timezone}/>
      ))}
      {!timers.length > 0 ? 
        <NoTimeEntry/>
        : ''
      }
    </div>
  );
}
