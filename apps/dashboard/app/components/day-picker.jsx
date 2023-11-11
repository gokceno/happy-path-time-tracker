import { DateTime, Interval, Duration } from 'luxon';
import { Link } from "@remix-run/react";
import Day from "./day";

const DayPicker = ({ stats, selectedDate, culture }) => {
  const weeklyInterval = Interval.fromDateTimes(
    DateTime.fromISO(selectedDate).setLocale(culture).startOf('week'),
    DateTime.fromISO(selectedDate).setLocale(culture).endOf('week')
  );
  const days = weeklyInterval.splitBy(Duration.fromObject({ day: 1 }));
  return (
    <div className="relative rounded-2xl bg-primary-light-baby-powder w-[672px] flex flex-row pt-6 px-6 pb-4 box-border items-center justify-between text-center text-lgi text-shades-of-teal-teal-400 font-primary-small-body-h5-medium">
      <div className="rounded-80xl flex flex-row p-1 items-center justify-center">
        <Link to={`/dashboard/daily/${DateTime.fromISO(selectedDate).minus({days: 7}).startOf('week').toISODate()}`}>
          <img
            className="relative w-6 h-6 overflow-hidden shrink-0"
            alt="Previous week"
            src="/chevronleft.svg"
          />
        </Link>
      </div>
      <div className="flex flex-row items-start justify-start gap-[16px]">
      {days.map(day => 
        <Day key={day.start} date={day.start} duration={stats?.byDate?.find(date => date.date == day.start.toISODate())?.totalDuration}/>
      )}
      </div>
      <div className="rounded-80xl flex flex-row p-1 items-center justify-center">
        <Link to={`/dashboard/daily/${DateTime.fromISO(selectedDate).plus({days: 7}).startOf('week').toISODate()}`}>
          <img
            className="relative w-6 h-6 overflow-hidden shrink-0"
            alt="Next week"
            src="/chevronright.svg"
          />
        </Link>
      </div>
    </div>
  );
};

export default DayPicker;
