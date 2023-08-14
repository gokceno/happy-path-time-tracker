import { Outlet, useParams, useLoaderData } from "@remix-run/react";
import { json, redirect } from '@remix-run/node';
import { Frontend as Client } from '@happy-path/graphql-client';
import { auth as authCookie } from '~/utils/cookies.server';
import WeekPicker from "../components/week-picker";

const StatsQuery = `
  query Stats($onDate: String!) {
    stats(date: $onDate) {
      byInterval {
        type
        startsAt
        endsAt
        totalDuration
      }
    }
  }
`;

export const meta = () => ([
  { title: 'Weekly Dashboard - Happy Path' }
]);

export const loader = async ({ request, params }) => {
  const { token } = await authCookie.parse(request.headers.get('cookie')) || {};
  if(token == undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  const { week: onDate } = params;
  const response = await Client({ token }).query(StatsQuery, { onDate });
  return json({ 
    currentTimeEntriesInterval: 'weekly',
    stats: response?.data?.stats, 
    timezone: process.env.TIMEZONE || 'UTC',
  });
};

export const shouldRevalidate = ({ currentParams, nextParams, defaultShouldRevalidate })  => {
  return currentParams.week !== nextParams.week ? true : defaultShouldRevalidate;
}

export default function DashboardWeeklyRoute() {
  const { week } = useParams();
  const { stats, timezone } = useLoaderData();
  return (
    <div className="w-[671px] flex flex-col pt-0 px-0 pb-8 box-border items-center justify-start gap-[32px] min-w-[345px] max-w-[906px]">
      <div className="self-stretch flex flex-col items-start justify-start">
        <WeekPicker stats={stats} timezone={timezone} selectedDate={week}/>
      </div>
      <Outlet/>
    </div>
  );
}
