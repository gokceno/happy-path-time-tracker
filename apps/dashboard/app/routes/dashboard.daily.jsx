import { Outlet, useLoaderData, useParams } from '@remix-run/react';
import { Frontend as Client } from '@happy-path/graphql-client';
import { json, redirect } from '@remix-run/node';
import { auth as authCookie } from '~/utils/cookies.server';
import DayPicker from '../components/day-picker';

const StatsQuery = `
  query Stats($onDate: String!) {
    stats(date: $onDate) {
      byDate {
        date
        totalDuration
      }
    }
  }
`;

export const meta = () => ([
  { title: 'Daily Dashboard - Happy Path' }
]);

export const loader = async ({ request, params }) => {
  const { token } = await authCookie.parse(request.headers.get('cookie')) || {};
  if(token == undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  const { day: onDate } = params;
  const response = await Client({ token }).query(StatsQuery, { onDate });
  return json({ 
    currentTimeEntriesInterval: 'daily',
    stats: response?.data?.stats, 
    timezone: process.env.TIMEZONE || 'UTC',
    culture: process.env.LOCALE_CULTURE || 'en-US',
  });
}

export const shouldRevalidate = ({ currentParams, nextParams, defaultShouldRevalidate })  => {
  return currentParams.day !== nextParams.day ? true : defaultShouldRevalidate;
}

export default function DashboardDailyRoute() {
  const { day: onDate } = useParams();
  const { stats, timezone, culture } = useLoaderData();
  return (
    <div className="w-[671px] flex flex-col pt-0 px-0 pb-8 box-border items-center justify-start gap-[32px] min-w-[345px] max-w-[906px]">
      <div className="self-stretch flex flex-col items-start justify-start">
        <DayPicker stats={stats} selectedDate={onDate} culture={culture}/>
      </div>
      <Outlet/>
    </div>
  );
}
