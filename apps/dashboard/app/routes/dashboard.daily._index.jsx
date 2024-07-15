import { redirect } from "@remix-run/node";
import { DateTime } from 'luxon';

export const loader = async () => {
  return redirect('/dashboard/daily/' + DateTime.local({ zone: process.env.TIMEZONE || 'UTC' }).toISODate());
};