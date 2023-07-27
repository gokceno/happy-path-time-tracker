import PeriodNavigationItem from "./period-navigation-item";

const PeriodNavigation = () => {
  return (
    <div className="w-[161px] flex flex-row items-center justify-between">
      <div className="flex flex-row items-center justify-end">
        <PeriodNavigationItem label="Daily" to="/dashboard/daily"/>
        <PeriodNavigationItem label="Weekly" to="/dashboard/weekly"/>
      </div>
    </div>
  );
};

export default PeriodNavigation;
