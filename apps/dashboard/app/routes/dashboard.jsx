import { Outlet } from "@remix-run/react";
import DayPicker from "../components/day-picker";

export default function Dashboard() {
  return (
    <div>
      <Outlet/>
    </div>
  );
}
