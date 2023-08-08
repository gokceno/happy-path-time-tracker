import { redirect } from "@remix-run/node";
import { auth as authCookie } from '~/utils/cookies.server';

export const loader = async () => {
  return redirect(
    process.env.LOGOUT_URI || '/auth/logout', { 
      headers: {
      'Set-Cookie': await authCookie.serialize({}),
    },
  })
};
