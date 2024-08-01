import { DateTime, Duration } from 'luxon';
import { Link, useFetcher, useSearchParams } from '@remix-run/react';

import { useEffect } from 'react';

String.prototype.ellipsis = function (n) {
  return this.substr(0, n - 1) + (this.length > n ? '...' : '');
};

const TimeEntry = ({
  timerId,
  taskName,
  timeEntryDescription,
  duration,
  isRunning,
  startsAt,
  timezone,
  relations,
}) => {
  let [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.data?.ok == false) {
      const flash = fetcher.data.error.graphQLErrors.map((e) => ({
        message: e.message,
      }));
      setSearchParams({ flash: btoa(JSON.stringify(flash)) });
    }
  }, [fetcher]);

  return (
    <div className="self-stretch min-w-[630px] bg-white hover:opacity-[0.8] rounded-lg mx-4 mb-4 py-2 px-4 flex flex-row box-border items-center justify-between text-left text-sm text-primary-dark-night font-primary-small-body-h5-medium border-b-[1px] border-solid border-slate-300 last:border-0">
      <div className="w-full group rounded-lg flex flex-col py-2 px-0 mr-4 items-start justify-start">
        <div className=" flex flex-row items-center justify-start relative gap-[4px]">
          <div className="h-6 py-0 px-2 rounded bg-shades-of-teal-teal-50 flex flex-row items-center justify-start z-[0] gap-4">
            <div className="relative leading-[133%] text-sm text-primary-dark-night">
              {taskName}
            </div>
          </div>
          <div className="group-hover:opacity-100 opacity-0 text-shades-of-cadet-gray-cadet-gray-500">
            &bull;{' '}
            <Link
              to={`/dashboard/daily/${DateTime.fromISO(startsAt, {
                zone: 'UTC',
              })
                .setZone(timezone)
                .toISODate()}/${timerId}/edit`}
              className="w-full no-underline bg-[transparent] mb-0 text-primary-dark-night hover:underline"
            >
              Edit • Remove
            </Link>
          </div>
        </div>
        <div className="w-full relative text-sm leading-[133%] mt-2 font-regular font-primary-small-body-h5-medium text-shades-of-cadet-gray-cadet-gray-400 text-left z-[1]">
          {timeEntryDescription || 'Notes empty. Edit to add some.'}
        </div>
        {relations?.length > 0 && (
          <ul className="m-0 p-0 mt-2 list-none">
            {relations.map((link, index) => (
              <li
                key={index}
                className="py-0.5 marker:text-color"
              >
                &bull;{' '}
                <a
                  onClick={(event) => event.stopPropagation()}
                  href={typeof link === 'string' ? link : link?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-shades-of-teal-teal-400 no-underline hover:underline"
                >
                  {(typeof link === 'string'
                    ? link
                    : link?.data?.title
                  ).ellipsis(64)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-row items-center justify-end gap-[8px] text-shades-of-cadet-gray-cadet-gray-500 font-roboto-mono">
        <div className="flex flex-col py-1 px-2 items-start justify-start">
          <div className="relative leading-[133%]">
            {Duration.fromObject({ minutes: duration }).toFormat('hh:mm')}
          </div>
        </div>
        {DateTime.local({ zone: timezone }).toISODate() ==
        DateTime.fromISO(startsAt, { zone: 'UTC' })
          .setZone(timezone)
          .toISODate() ? (
          <div>
            {isRunning ? (
              <fetcher.Form
                method="post"
                action="/timers/stop"
              >
                <input
                  value={timerId}
                  type="hidden"
                  name="timerId"
                />
                <button className="cursor-pointer rounded-81xl bg-shades-of-dark-04 w-8 h-8 flex flex-row py-[7px] pr-[7px] pl-2.5 box-border items-center justify-center">
                  <img
                    className="relative rounded-12xs w-[12.09px] h-[14.42px]"
                    alt="Stop"
                    src="/pause.svg"
                  />
                </button>
              </fetcher.Form>
            ) : (
              <fetcher.Form
                method="post"
                action="/timers/restart"
              >
                <input
                  value={timerId}
                  type="hidden"
                  name="timerId"
                />
                <button className="cursor-pointer rounded-81xl bg-shades-of-dark-04 w-8 h-8 flex flex-row py-[7px] pr-[7px] pl-2.5 box-border items-center justify-center">
                  <img
                    className="relative rounded-12xs w-[12.09px] h-[14.42px]"
                    alt="Start"
                    src="/play.svg"
                  />
                </button>
              </fetcher.Form>
            )}
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default TimeEntry;
