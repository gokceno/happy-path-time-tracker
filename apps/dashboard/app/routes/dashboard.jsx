import { Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import { json, redirect } from '@remix-run/node';
import * as Toast from '@radix-ui/react-toast';
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
  let [searchParams, setSearchParams] = useSearchParams();
  let notifications = [];
  if(searchParams.get('flash')) {
    try {
      const flash = JSON.parse(atob(searchParams.get('flash')));
      notifications = flash.map(f => f.message);
    }
    catch(e) {
      console.error(e);
    }
  }
  const { email } = useLoaderData();
  return (
    <div className="relative bg-shades-of-cadet-gray-cadet-gray-900 w-full h-screen left-[50%] transform translate-x-[-50%]">
      <div className="absolute top-[0px] left-[0px] bg-primary-real-white w-full flex flex-col py-0 px-8 box-border items-center justify-start h-full">
        <Header email={email} />
        <Outlet/>
      </div>
      <Toast.Provider duration={2500}>
        { notifications.map(notification =>  
          <Toast.Root 
            defaultOpen="true" 
            onOpenChange={(isOpen) => (setSearchParams({}))}
            className="bg-shades-of-teal-teal-400 rounded-md p-[15px] grid [grid-template-areas:_'title_action'_'description_action'] grid-cols-[auto_max-content] gap-x-[15px] items-center data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut">
            <Toast.Description className="text-primary-real-white font-primary-small-body-h5-medium">
              { notification }
            </Toast.Description>
          </Toast.Root>
        )}
        <Toast.Viewport className="[--viewport-padding:_25px] fixed bottom-0 right-0 flex flex-col p-[var(--viewport-padding)] gap-[10px] w-[390px] max-w-[100vw] m-0 list-none z-[2147483647] outline-none"/>
      </Toast.Provider>
    </div>
  );
}