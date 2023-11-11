import * as Dialog from '@radix-ui/react-dialog';

import { Link, Outlet, useParams } from '@remix-run/react';

import { redirect } from '@remix-run/node';

export default function TimersRoute() {
  const { day } = useParams();
  return (
    <Dialog.Root defaultOpen="true" onOpenChange={() => (location.href = `/dashboard/daily/${day}`)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-primary-dark-night/[0.32]"/>
          <Dialog.Content className="overflow-y-auto h-96 font-primary-small-body-h5-semibold absolute top-[calc(50%_-_258px)] left-[calc(50%_-_197px)] rounded-2xl bg-primary-real-white shadow-[0px_8px_16px_rgba(31,_45,_61,_0.24)] w-[395px] flex flex-col py-6 px-0 box-border items-start justify-start text-sm">
            <Dialog.Title className="self-stretch flex flex-row pt-0 pr-0 pl-6 items-center justify-start opacity-[0.8] z-[1] text-lgi">
              <div className="relative leading-[133%] font-medium">Time Log</div>
              <Link to={`/dashboard/daily/${day}`}>
                <div className="my-0 mx-[!important] absolute top-[15.5px] left-[347px] rounded-80xl w-8 flex flex-row p-1 box-border items-center justify-between z-[0]">
                  <img
                    className="relative w-6 h-6 overflow-hidden shrink-0"
                    alt="Close window"
                    src="/x.svg"
                  />
                </div>
              </Link>
            </Dialog.Title>
            <Outlet/>
          </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
