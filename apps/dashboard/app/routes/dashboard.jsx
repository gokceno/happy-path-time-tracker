import { Outlet } from "@remix-run/react";
import DayPicker from "../components/day-picker";

export const meta = () => ([
  { title: 'Dashboard - Happy Path' }
]);

export default function Dashboard() {
  return (
    <div>
      <Outlet/>
    </div>
  );
}
