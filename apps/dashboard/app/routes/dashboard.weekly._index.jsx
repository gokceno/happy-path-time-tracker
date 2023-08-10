import { redirect, LoaderFunction } from "@remix-run/node";
import { DateTime } from 'luxon';

export const loader = async () => {
  return redirect('/dashboard/weekly/' + DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).startOf('week').plus({ day: 1 }).toISODate());
};