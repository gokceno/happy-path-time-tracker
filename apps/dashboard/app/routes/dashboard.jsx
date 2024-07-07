import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Toast from '@radix-ui/react-toast';
// import { jwtVerify } from 'jose';

import {
  Outlet,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from '@remix-run/react';

import { json } from '@remix-run/node';

import Header from '../components/header';
// import { auth as authCookie } from '~/utils/cookies.server';
import { useState } from 'react';

export const meta = () => [{ title: 'Dashboard - Happy Path' }];

export const loader = async ({ request }) => {
  /*
  const token = await authCookie.parse(request.headers.get('cookie'));
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const {
    payload: { email },
  } = await jwtVerify(token, secret);
  */
  return json({
    email: "gokcen@brewww.com",
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  let [searchParams, setSearchParams] = useSearchParams();

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  let notifications = [];
  if (searchParams.get('flash')) {
    try {
      const flash = JSON.parse(atob(searchParams.get('flash')));
      notifications = flash.map((f) => f.message);
    } catch (e) {
      console.error(e);
    }
  }
  const { email } = useLoaderData();

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  return (
    <div className="relative bg-shades-of-cadet-gray-cadet-gray-900 w-full h-screen left-[50%] transform translate-x-[-50%]">
      <div className="absolute top-[0px] left-[0px] bg-primary-real-white w-full flex flex-col py-0 px-8 box-border items-center justify-start h-full">
        <Header
          email={email}
          onLogout={handleLogout}
        />
        <Outlet />
      </div>
      <Toast.Provider duration={2500}>
        {notifications.map((notification, index) => (
          <Toast.Root
            key={index}
            defaultOpen="true"
            onOpenChange={(isOpen) => setSearchParams({})}
            className="bg-shades-of-teal-teal-400 rounded-md p-[15px] grid [grid-template-areas:_'title_action'_'description_action'] grid-cols-[auto_max-content] gap-x-[15px] items-center data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut"
          >
            <Toast.Description className="text-primary-real-white font-primary-small-body-h5-medium">
              {notification}
            </Toast.Description>
          </Toast.Root>
        ))}
        <Toast.Viewport className="[--viewport-padding:_25px] fixed bottom-0 right-0 flex flex-col p-[var(--viewport-padding)] gap-[10px] w-[390px] max-w-[100vw] m-0 list-none z-[2147483647] outline-none" />
      </Toast.Provider>

      <AlertDialog.Root
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-primary-dark-night/[0.32]" />
          <AlertDialog.Content className="overflow-y-auto font-primary-small-body-h5-semibold absolute top-[calc(50%_-_258px)] left-[calc(50%_-_197px)] rounded-2xl bg-primary-real-white shadow-[0px_8px_16px_rgba(31,_45,_61,_0.24)] w-[395px] flex flex-col py-6 px-0 box-border items-start justify-start text-sm">
            <AlertDialog.Title className="self-stretch flex flex-row pt-0 pr-0 pl-6 items-center justify-start text-lgi font-medium">
              You're about to log out, are you sure?
            </AlertDialog.Title>
            <AlertDialog.Description className="self-stretch flex flex-row m-0 pt-0 pr-6 items-center justify-end gap-[8px]">
              <AlertDialog.Action asChild>
                <button
                  className="cursor-pointer [border:none] mt-2 p-4 bg-shades-of-cadet-gray-cadet-gray-50 text-shades-of-cadet-gray-cadet-gray-400 self-stretch rounded-9xl h-12 flex flex-row box-border items-center justify-center relative gap-[8px]"
                  onClick={() => {
                    setIsLogoutDialogOpen(false);
                  }}
                >
                  <div className="relative text-base leading-[133%] font-medium font-primary-small-body-h5-semibold text-left z-[2]">
                    No, I want to stay
                  </div>
                </button>
              </AlertDialog.Action>
              <AlertDialog.Action asChild>
                <button
                  type="submit"
                  className="cursor-pointer [border:none] mt-2 p-4 bg-shades-of-teal-teal-300 self-stretch rounded-9xl h-12 flex flex-row box-border items-center justify-center relative gap-[8px]"
                  onClick={() => {
                    navigate('/logout');
                  }}
                >
                  <div className="relative text-base leading-[133%] font-medium font-primary-small-body-h5-semibold text-primary-real-white text-left z-[2]">
                    Yes, log out!
                  </div>
                </button>
              </AlertDialog.Action>
            </AlertDialog.Description>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
