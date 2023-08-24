import { Link, useParams, useFetcher } from "@remix-run/react";
import ModalSelectItem from '~/components/modal-select-item';

export default function TimerStartRoute() {
  const { day, project, task } = useParams();
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post" action="/timers/start" className="self-stretch flex flex-col p-6 items-center justify-start z-[2] text-shades-of-cadet-gray-cadet-gray-600">
      <input value={task} type="hidden" name="projectTaskId"/>
      <input value={day} type="hidden" name="day"/>
      <div className="self-stretch flex flex-col items-center justify-start">
        <div className="self-stretch box-border h-12 flex flex-row items-center justify-center border-b-[1px] border-solid border-shades-of-teal-teal-400">
          <div className="rounded-lg flex flex-row py-1 px-2 items-center justify-center">
            <input
              className="[border:none] font-space-mono text-3xl bg-[transparent] relative leading-[133%] text-primary-dark-night text-center"
              type="text"
              name="notes"
              placeholder="Comments"
            />
          </div>
        </div>
        <div className="self-stretch box-border h-12 flex flex-row items-center justify-center border-b-[1px] border-solid border-shades-of-teal-teal-400">
          <div className="rounded-lg flex flex-row py-1 px-2 items-center justify-center">
            <input
              className="[border:none] font-space-mono text-3xl bg-[transparent] relative leading-[133%] text-primary-dark-night text-center"
              type="text"
              name="duration"
              placeholder="00:00 (optional)"
            />
          </div>
        </div>
      </div>
      <button type="submit" className="cursor-pointer [border:none] mt-3 p-3 bg-shades-of-teal-teal-300 self-stretch rounded-9xl h-12 flex flex-row box-border items-center justify-center relative gap-[8px]">
        <div className="relative text-base leading-[133%] font-medium font-primary-small-body-h5-semibold text-primary-real-white text-left z-[2]">
          Start Tracking
        </div>
      </button>
      <div className="self-stretch rounded-lg flex flex-row pt-4 pb-0 items-center justify-start gap-[8px] z-[3]">
        <Link to={`/dashboard/daily/${day}/${project}/tasks`} className="rounded-9xl h-8 flex flex-row py-1 pr-2 pl-0 box-border items-center justify-center relative gap-[4px] text-shades-of-teal-teal-400">
          <img
            className="relative w-6 h-6 overflow-hidden shrink-0 z-[0]"
            alt="Back to Tasks"
            src="/chevronleft.svg"
          />
          <div className="relative leading-[133%] z-[1]">
            Back to Tasks
          </div>
        </Link>
      </div>
    </fetcher.Form>
  );
}
