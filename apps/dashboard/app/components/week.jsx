import { Link, useParams } from "@remix-run/react";
import { DateTime, Duration } from 'luxon';

const Week = ({ date, duration }) => {
  const { week: selectedDate } = useParams();
  const isCurrentWeek = (date.start.toMillis() <= DateTime.fromISO(selectedDate).toMillis() && date.end.toMillis() > DateTime.fromISO(selectedDate).toMillis());
  return (
  <div className={`flex flex-col items-center justify-start gap-[8px] ${isCurrentWeek ? 'text-primary-real-white' : 'text-shades-of-teal-teal-400'}`}>
    <Link to={'/dashboard/weekly/' + date.start.toISODate()} className={`hover:bg-shades-of-dark-04 no-underline rounded-2xl ${isCurrentWeek ? 'text-primary-real-white bg-shades-of-teal-teal-400' : 'bg-shades-of-light-white-88 text-shades-of-teal-teal-400'} w-14 h-[72px] flex flex-col p-2 box-border items-center justify-center`}>
      <div className="relative leading-[133%] font-semibold font-primary-small-body-h5-medium">
        <p className="m-0">{date.start.toFormat('dd.LL')}</p>
        <p className="m-0">{date.end.toFormat('dd.LL')}</p>
      </div>
    </Link>
    <div className="self-stretch rounded bg-shades-of-light-white-04 flex flex-row p-1 items-center justify-center relative text-left text-shades-of-cadet-gray-cadet-gray-500 font-roboto-mono">
      <div className="absolute my-0 mx-[!important] h-full w-full top-[0px] right-[0px] bottom-[0px] left-[0px] rounded bg-shades-of-dark-08 hidden z-[0]" />
      <div className="h-6 flex flex-row items-center justify-center z-[2]">
        <div className="relative leading-[150%]">{Duration.fromObject({ minutes: duration }).toFormat('hh:mm')}</div>
      </div>
    </div>
  </div>
  );
};

export default Week;
