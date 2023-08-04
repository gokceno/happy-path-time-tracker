import { Outlet, useLoaderData } from "@remix-run/react";
import { json } from '@remix-run/node';
import { verify } from 'jsonwebtoken';
import { auth as authCookie } from '~/utils/cookies.server';
import Header from "../components/header";

export const meta = () => ([
  { title: 'Dashboard - Happy Path' }
]);

export const loader = async ({ request }) => {
  const { token } = await authCookie.parse(request.headers.get('cookie'));
  const { email } = verify(token, process.env.JWT_SECRET);
  return json({
    email
  });
}

export default function Dashboard() {
  const { email } = useLoaderData();
  return (
    <div className="relative bg-shades-of-cadet-gray-cadet-gray-900 w-[1440px] h-[944px]">
      <div className="absolute top-[0px] left-[0px] bg-primary-real-white w-[1440px] flex flex-col py-0 px-8 box-border items-center justify-start h-full">
        <Header email={email} />
        <Outlet/>
      </div>
    </div>
  );
}