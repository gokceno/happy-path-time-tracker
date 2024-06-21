import { redirect } from '@remix-run/node';
import { auth as authCookie } from '~/utils/cookies.server';

export const loader = async () => {
  return redirect('/login', {
    headers: {
      'Set-Cookie': await authCookie.serialize('', { maxAge: -1 }),
    },
  });
};
