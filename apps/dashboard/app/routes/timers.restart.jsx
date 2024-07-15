import { json, redirect } from '@remix-run/node';
import { jwtVerify } from 'jose';
import { Frontend as GraphQLClient } from '@happy-path/graphql-client';
import { Timers } from '@happy-path/graphql-entities';
import { auth as authCookie, email as emailCookie } from '~/utils/cookies.server';

export const action = async ({ request }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  const email = await emailCookie.parse(request.headers.get('cookie'));
  try {
    const secret = new TextEncoder().encode(process.env.DIRECTUS_JWT_SECRET);
    await jwtVerify(token, secret);
  } catch (e) {
    return redirect('/logout');
  }
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
    }).restart({
      timerId,
      email,
    });
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error });
  }
};
