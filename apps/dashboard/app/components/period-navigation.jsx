import { useMatches } from "@remix-run/react";
import PeriodNavigationItem from "./period-navigation-item";

const PeriodNavigation = () => {
  const match = useMatches().find((match) => match.data?.currentTimeEntriesInterval !== undefined)?.data;
  return (
    <div className="w-[161px] flex flex-row items-center justify-between">
      <div className="flex flex-row items-center justify-end">
        <PeriodNavigationItem label="Daily" to="/dashboard/daily" isActive={(match?.currentTimeEntriesInterval == 'daily')}/>
        <PeriodNavigationItem label="Weekly" to="/dashboard/weekly" isActive={(match?.currentTimeEntriesInterval == 'weekly')}/>
      </div>
    </div>
  );
};

export default PeriodNavigation;
