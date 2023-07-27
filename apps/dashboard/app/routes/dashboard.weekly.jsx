import { Outlet, useParams } from "@remix-run/react";
import WeekPicker from "../components/week-picker";

export default function DashboardWeeklyRoute() {
  const { week } = useParams();
  return (
    <div className="w-[671px] flex flex-col pt-0 px-0 pb-8 box-border items-center justify-start gap-[32px] min-w-[345px] max-w-[906px]">
      <div className="self-stretch flex flex-col items-start justify-start">
        <WeekPicker selectedDate={week}/>
      </div>
      <Outlet/>
    </div>
  );
}
