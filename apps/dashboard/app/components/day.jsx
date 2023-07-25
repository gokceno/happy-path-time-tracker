import { Link, useParams } from "@remix-run/react";
import { DateTime, Duration } from 'luxon';

const Day = ({ date, duration }) => {
  const { day: selectedDate } = useParams();
  const isCurrentDay = (date.toISODate() == DateTime.fromISO(selectedDate).toISODate());
  return (
    <div className={`flex flex-col items-center justify-start gap-[8px]`}>
      <Link to={'/dashboard/daily/' + date.toISODate() } className={`no-underline ${isCurrentDay ? 'text-center text-lgi text-primary-real-white font-primary-small-body-h5-medium' : 'text-shades-of-teal-teal-400'}`}>
        <div className={`rounded-81xl ${isCurrentDay ? 'bg-shades-of-teal-teal-400 p-4' : 'bg-shades-of-light-white-88 p-25'} w-14 h-14 flex flex-col box-border items-center justify-center`}>
          <b className="relative leading-[133%]">{date.toFormat('dd')}</b>
          <div className={ `relative text-xs leading-[133%] ${isCurrentDay ? 'text-shades-of-light-white-64' : 'text-shades-of-cadet-gray-cadet-gray-500'}`}>
            {date.toFormat('LLL')}
          </div>
        </div>
      </Link>
      <div className="self-stretch rounded bg-shades-of-light-white-04 flex flex-row p-1 items-center justify-center relative text-left text-sm text-shades-of-cadet-gray-cadet-gray-500 font-roboto-mono">
        <div className="h-6 flex flex-row items-center justify-center z-[2]">
          <div className="relative leading-[150%]">{Duration.fromObject({ minutes: duration }).toFormat('hh:mm')}</div>
        </div>
      </div>
    </div>
  );
};

export default Day;
