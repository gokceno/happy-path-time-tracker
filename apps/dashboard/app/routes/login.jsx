import { SignJWT, jwtVerify } from 'jose';
import { useState } from 'react';
import { Form, useFetcher } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { Frontend as Client } from '@happy-path/graphql-client';
import { auth as authCookie } from '~/utils/cookies.server';

const LoginMutation = `
  mutation Login($email: String!, $password: String!) {
    auth_login(email: $email, password: $password) {
      access_token
      refresh_token
    }
  }
`;

export const action = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  if (email === undefined || password === undefined) return json({ error: '' });
  const response = await Client({
    url: (process.env.API_DIRECTUS_URL || '') + '/graphql/system',
  }).mutation(LoginMutation, {
    email,
    password,
  });
  if (response.data?.auth_login !== null) {
    const directusJWTSecret = new TextEncoder().encode(
      process.env.DIRECTUS_JWT_SECRET
    );
    const {
      payload: { id, app_access: hasAppAccess },
    } = await jwtVerify(
      response.data.auth_login.access_token,
      directusJWTSecret
    );
    if (hasAppAccess === true) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({ email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(process.env.JWT_EXPIRES || '1h')
        .sign(secret);
      return redirect('/dashboard', {
        headers: {
          'Set-Cookie': await authCookie.serialize(token),
        },
      });
    } else {
      return json({ ok: false });
    }
  } else {
    return json({ ok: false, error: response.error });
  }
};

const Login = () => {
  const fetcher = useFetcher();
  return (
    <div className="relative font-primary-small-body-h5-medium bg-shades-of-cadet-gray-cadet-gray-50 w-full min-h-screen flex items-center">
      <div className="flex flex-col max-w-[340px] w-full m-auto items-center justify-center">
        <img
          className="relative w-[38px]"
          alt="Happy Path"
          src="/hummingbird.png"
        />
        <div className="flex flex-col justify-center p-8 bg-white mt-8 w-full rounded-lg">
          <h2 className="my-0 text-center text-xl font-semibold leading-9 tracking-tight text-primary-dark-night">
            Sign in to your account
          </h2>

          <div className="mt-8 w-full">
            <fetcher.Form
              method="post"
              action="/login"
              className="space-y-6"
            >
              {fetcher.data?.ok === false && (
                <div
                  className="mt-4 -mb-4 text-sm bg-red-100 border text-center border-red-400 text-red-700 px-4 py-4 rounded-lg relative"
                  role="alert"
                >
                  <strong className="font-semibold">Holy smokes!</strong>
                  <br />
                  <span>Invalid login credentials. Please try again.</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-6 text-gray-500"
                >
                  Email address
                </label>
                <div className="mt-2 w-full">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full box-border first-letter:w-full font-primary-small-body-h5-semibold text-sm bg-[transparent] flex-1 rounded flex flex-row p-2 items-center justify-start border-[1px] border-solid border-shades-of-cadet-gray-cadet-gray-200 
                    disabled:border-shades-of-teal-teal-50 disabled:bg-shades-of-teal-teal-50 disabled:cursor-not-allowed disabled:hover:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium leading-6 text-gray-500"
                  >
                    Password
                  </label>
                  <div className="text-sm">
                    <a
                      href="/forgot-password"
                      className="font-medium text-shades-of-teal-teal-400  hover:opacity-70"
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full box-border first-letter:w-full font-primary-small-body-h5-semibold text-sm bg-[transparent] flex-1 rounded flex flex-row p-2 items-center justify-start border-[1px] border-solid border-shades-of-cadet-gray-cadet-gray-200 
                    disabled:border-shades-of-teal-teal-50 disabled:bg-shades-of-teal-teal-50 disabled:cursor-not-allowed disabled:hover:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full cursor-pointer [border:none] mt-3 p-3 bg-shades-of-teal-teal-300 self-stretch rounded-9xl h-12 flex flex-row box-border items-center justify-center relative gap-[8px]"
                >
                  <div className="relative text-base leading-[133%] font-medium font-primary-small-body-h5-semibold text-primary-real-white text-left z-[2]">
                    Sign in
                  </div>
                </button>
              </div>
            </fetcher.Form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Not sure about your password?
              <br />
              <a
                href="/forgot-password"
                className="font-medium leading-6 text-shades-of-teal-teal-400 hover:opacity-70"
              >
                Recover your account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
