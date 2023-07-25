import { Outlet, useLoaderData, useParams } from "@remix-run/react";
import { Client, fetchExchange, cacheExchange } from '@urql/core';
import { json } from '@remix-run/node';
import DayPicker from "../components/day-picker";

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
  const response = await GraphQLClient.query(StatsQuery, { onDate });
  return json({ 
    stats: response?.data?.stats, 
    timezone: process.env.TIMEZONE || 'UTC'
  });
};

export default function DashboardDailyRoute() {
  const { day: onDate } = useParams();
  const { stats, timezone } = useLoaderData();
  return (
    <div className="w-[671px] flex flex-col pt-0 px-0 pb-8 box-border items-center justify-start gap-[32px] min-w-[345px] max-w-[906px]">
      <div className="self-stretch flex flex-col items-start justify-start">
        <DayPicker stats={stats} timezone={timezone} selectedDate={onDate}/>
      </div>
      <Outlet/>
    </div>
  );
}
