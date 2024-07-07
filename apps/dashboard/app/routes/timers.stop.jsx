import { json, redirect } from '@remix-run/node';
import { Frontend as GraphQLClient } from '@happy-path/graphql-client';
import { Timers } from '@happy-path/graphql-entities';
import { auth as authCookie } from '~/utils/cookies.server';

export const action = async ({ request }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  if (token == undefined) return redirect('/login');
  const formData = await request.formData();
  const timerId = formData.get('timerId');
  const client = GraphQLClient({
    token,
    url: process.env.API_DIRECTUS_URL + '/graphql/',
  });
  try {
    await Timers({
      client,
      timezone: process.env.TIMEZONE || 'UTC',
    }).stop({
      timerId,
      email: 'gokcen@brewww.com',
    });
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error });
  }
};
