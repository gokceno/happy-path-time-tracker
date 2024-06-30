import { json, redirect } from '@remix-run/node';
import { Frontend as Client } from '@happy-path/graphql-client';
import { auth as authCookie } from '~/utils/cookies.server';

const TimersMutation = `
  mutation Restart($timerId: Int!) {
    restart(timerId: $timerId) {
      id
    }
  }
`;

export const action = async ({ request }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  if (token == undefined) return redirect('/login');
  const formData = await request.formData();
  const timerId = formData.get('timerId');
  const response = await Client({ token }).mutation(TimersMutation, { timerId: +timerId });
  if(response.error != undefined) {
    return json({ ok: false, error: response.error });
  }
  return json({ ok: true });
};