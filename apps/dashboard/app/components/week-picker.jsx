import { DateTime, Interval, Duration } from 'luxon';
import { Link } from "@remix-run/react";
import Week from "./week";

const WeekPicker = ({ stats, timezone: zone, selectedDate }) => {
  const monthlyInterval = Interval.fromDateTimes(
    DateTime.fromISO(selectedDate).startOf('month'),
    DateTime.fromISO(selectedDate).endOf('month')
  );
  const weeks = monthlyInterval.splitBy(Duration.fromObject({ week: 1 }));
  return (
    <div className="self-stretch rounded-2xl bg-primary-light-baby-powder flex flex-row pt-6 px-6 pb-4 items-center justify-between text-center text-sm text-shades-of-teal-teal-400 font-primary-body-h4-p-medium">
      <Link to={`/dashboard/weekly/${DateTime.fromISO(selectedDate).minus({months: 1}).startOf('month').toISODate()}`} className="cursor-pointer [border:none] p-1 bg-[transparent] rounded-80xl flex flex-row items-center justify-center">
        <img className="relative w-6 h-6 overflow-hidden shrink-0" alt="Previous month" src="/chevronleft1.svg" />
      </Link>
      <div className="flex flex-row items-start justify-start gap-[20px]">
      {weeks.map(week => 
        <Week key={week} date={week} duration={stats?.byInterval?.find(date => date.type == 'week' && DateTime.fromISO(date.startsAt) >= week.start.setZone(zone) && DateTime.fromISO(date.endsAt) <= week.end.setZone(zone))?.totalDuration}/>
      )}
      </div>
      <Link to={`/dashboard/weekly/${DateTime.fromISO(selectedDate).plus({months: 1}).startOf('month').toISODate()}`} className="cursor-pointer [border:none] p-1 bg-[transparent] rounded-80xl flex flex-row items-center justify-center">
        <img className="relative w-6 h-6 overflow-hidden shrink-0" alt="Next month" src="/chevronright1.svg" />
      </Link>
    </div>
  );
};

export default WeekPicker;
