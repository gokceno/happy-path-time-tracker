import { useParams } from "@remix-run/react";
import { json, redirect } from '@remix-run/node';
import { Frontend as Client } from '@happy-path/graphql-client';
import { auth as authCookie } from '~/utils/cookies.server';

const TimersMutation = `
  mutation Remove($timerId: Int!) {
    remove(timerId: $timerId) {
      id
    }
  }
`;

export const loader = async ({ request, params }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  if (token == undefined) return redirect('/login');
  const { day, timer } = params;
  let flash = [];
  const response = await Client({ token }).mutation(TimersMutation, { timerId: +timer });
  response.error !== undefined ? flash.push({message: response.error}) : flash.push({message: 'You removed your time entry. Good job!'});
  return redirect(`/dashboard/daily/${day}?flash=${btoa(JSON.stringify(flash))}`);
};