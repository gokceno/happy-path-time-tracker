import { DateTime, Interval, Duration } from 'luxon';
import { jwtVerify } from 'jose';
import { Outlet, useLoaderData, useParams } from '@remix-run/react';
import { Frontend as GraphQLClient } from '@happy-path/graphql-client';
import { Timers } from '@happy-path/graphql-entities';
import { json, redirect } from '@remix-run/node';
import {
  auth as authCookie,
  email as emailCookie,
} from '~/utils/cookies.server';
import DayPicker from '../components/day-picker';

export const meta = () => [{ title: 'Daily Dashboard - Happy Path' }];

export const loader = async ({ request, params }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  const email = await emailCookie.parse(request.headers.get('cookie'));
  
  try {
    const secret = new TextEncoder().encode(process.env.DIRECTUS_JWT_SECRET);
    await jwtVerify(token, secret);
  } catch (e) {
    return redirect('/logout');
  }
  const { day: date } = params;
  const client = GraphQLClient({
    token,
    url: process.env.API_DIRECTUS_URL + '/graphql/',
  });
  const timers = await Timers({
    client,
    timezone: process.env.TIMEZONE || 'UTC',
  }).findTimersByUserId({
    startsAt: DateTime.fromISO(date, { zone: 'UTC' })
      .startOf('month')
      .minus({ week: 1 })
      .toUTC(),
    endsAt: DateTime.fromISO(date, { zone: 'UTC' })
      .endOf('month')
      .plus({ week: 1 })
      .toUTC(),
    email,
  });
  const monthlyInterval = Interval.fromDateTimes(
    DateTime.fromISO(date).startOf('month'),
    DateTime.fromISO(date).endOf('month')
  );
  const weeklyInterval = Interval.fromDateTimes(
    DateTime.fromISO(date).startOf('week'),
    DateTime.fromISO(date).endOf('week')
  );
  const byDate = weeklyInterval
    .splitBy(Duration.fromObject({ day: 1 }))
    .map((weekday) => ({
      totalDuration: timers
        .filter(
          (timer) =>
            DateTime.fromISO(timer.starts_at, { zone: 'UTC' })
              .setZone(process.env.TIMEZONE || 'UTC')
              .toISODate() == weekday.start.toISODate()
        )
        .reduce((acc, timer) => acc + timer.total_duration, 0),
      date: weekday.start.toISODate(),
    }));
  const byWeeklyIntervals = monthlyInterval
    .splitBy(Duration.fromObject({ week: 1 }))
    .map((week) => ({
      type: 'week',
      totalDuration: timers
        .filter(
          (timer) =>
            DateTime.fromISO(timer.starts_at, { zone: 'UTC' }).setZone(
              process.env.TIMEZONE || 'UTC'
            ) >= week.start &&
            DateTime.fromISO(timer.ends_at, { zone: 'UTC' }).setZone(
              process.env.TIMEZONE || 'UTC'
            ) <= week.end
        )
        .reduce((acc, timer) => acc + timer.total_duration, 0),
      startsAt: week.start.setZone(process.env.TIMEZONE || 'UTC').toISO(),
      endsAt: week.end.setZone(process.env.TIMEZONE || 'UTC').toISO(),
    }));
  const stats = {
    byDate,
    byInterval: [
      {
        type: 'month',
        startsAt: DateTime.local({ zone: process.env.TIMEZONE || 'UTC' })
          .startOf('month')
          .toISO(),
        endsAt: DateTime.local({ zone: process.env.TIMEZONE || 'UTC' })
          .endOf('month')
          .toISO(),
        totalDuration: timers.reduce(
          (acc, timer) => acc + timer.total_duration,
          0
        ),
      },
      ...byWeeklyIntervals,
    ],
  };

  return json({
    currentTimeEntriesInterval: 'daily',
    stats,
    timezone: process.env.TIMEZONE || 'UTC',
    culture: process.env.LOCALE_CULTURE || 'en-US',
  });
};

export const shouldRevalidate = ({
  currentParams,
  nextParams,
  defaultShouldRevalidate,
}) => {
  return currentParams.day !== nextParams.day ? true : defaultShouldRevalidate;
};

export default function DashboardDailyRoute() {
  const { day: onDate } = useParams();
  const { stats, culture } = useLoaderData();
  return (
    <div className="w-[671px] flex flex-col pt-0 px-0 pb-8 box-border items-center justify-start gap-[32px] min-w-[345px] max-w-[906px]">
      <div className="self-stretch flex flex-col items-start justify-start">
        <DayPicker
          stats={stats}
          selectedDate={onDate}
          culture={culture}
        />
      </div>
      <Outlet />
    </div>
  );
}
