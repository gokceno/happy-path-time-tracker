import { Outlet, useLoaderData } from "@remix-run/react";
import { json, redirect } from '@remix-run/node';
import * as jose from 'jose';
import { auth as authCookie } from '~/utils/cookies.server';
import Header from "../components/header";

export const meta = () => ([
  { title: 'Dashboard - Happy Path' }
]);

export const loader = async ({ request }) => {
  const { token } = await authCookie.parse(request.headers.get('cookie')) || {};
  if(token == undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET,
  );
  const { payload: { email } } = await jose.jwtVerify(token, secret);
  return json({
    email
  });
}

export default function Dashboard() {
  const { email } = useLoaderData();
  return (
    <div className="relative bg-shades-of-cadet-gray-cadet-gray-900 w-full h-[944px] left-[50%] transform translate-x-[-50%]">
      <div className="absolute top-[0px] left-[0px] bg-primary-real-white w-full flex flex-col py-0 px-8 box-border items-center justify-start h-full">
        <Header email={email} />
        <Outlet/>
      </div>
    </div>
  );
}