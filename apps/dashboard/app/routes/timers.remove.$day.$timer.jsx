import { redirect } from '@remix-run/node';
import { Frontend as GraphQLClient } from '@happy-path/graphql-client';
import { Timers } from '@happy-path/graphql-entities';
import { auth as authCookie } from '~/utils/cookies.server';

export const loader = async ({ request, params }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  if (token == undefined) return redirect('/login');
  const { day, timer } = params;
  let flash = [];
  const client = GraphQLClient({
    token,
    url: process.env.API_DIRECTUS_URL + '/graphql/',
  });
  try {
    const timezone = process.env.TIMEZONE || 'UTC';
    await Timers({
      client,
      timezone,
    }).remove({
      timerId: +timer
    });
    flash.push({ message: 'You removed your time entry. Good job!' });
  } catch (e) {
    flash.push({ message: e.message });
  }
  return redirect(
    `/dashboard/daily/${day}?flash=${btoa(JSON.stringify(flash))}`
  );
};
