import { Outlet, useLoaderData, useParams } from "@remix-run/react";
import { json } from '@remix-run/node';
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

export const loader = async ({ params }) => {
  const { day: onDate } = params;
  const GraphQLClient = new Client({
    url: process.env.API_GRAPHQL_URL,
    exchanges: [fetchExchange, cacheExchange],
    fetchOptions: () => {
      return {
        headers: { authorization: 'Bearer ' + process.env.TEMP__TOKEN },
      };
    },
  });
  const response = await GraphQLClient.query(TimersQuery, {
    startsAt: DateTime.fromISO(onDate).startOf('day').toISO(),
    endsAt: DateTime.fromISO(onDate).endOf('day').toISO(),
  });
  return json({
    timers: response?.data?.timers || [],
    culture: process.env.LOCALE_CULTURE || 'en-US'
  });
};

export default function DashboardDailyDayRoute() {
  const params = useParams();
  const { timers, culture } = useLoaderData();
  const totalDuration = timers.reduce((acc, timer) => (acc + timer.totalDuration), 0);
  const projects = timers.reduce((acc, timer) => {
    if (!acc.includes(timer.project.name)) {
      acc.push(timer.project.name);
    }
    return acc;
  }, []);
  return (
    <div className="self-stretch flex flex-col items-start justify-start gap-[16px] text-left text-lgi text-primary-dark-night font-primary-small-body-h5-medium">
      <SectionHeader sectionTitle={DateTime.fromISO(params.day).isValid ? DateTime.fromISO(params.day).setLocale(culture).toLocaleString(DateTime.DATE_MED) : 'Logs'} totalDuration={totalDuration}/>
      {projects.map((project) => (
        <ClientContainer key={project} clientName={project} timers={timers}/>
      ))}
      {!timers.length > 0 ? 
        <NoTimeEntry/>
        : ''
      }
    </div>
  );
}
