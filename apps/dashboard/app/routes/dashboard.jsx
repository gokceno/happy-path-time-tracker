import { Outlet } from "@remix-run/react";
import Header from "../components/header";

export const meta = () => ([
  { title: 'Dashboard - Happy Path' }
]);

export default function Dashboard() {
  return (
    <div className="relative bg-shades-of-cadet-gray-cadet-gray-900 w-[1440px] h-[944px]">
      <div className="absolute top-[0px] left-[0px] bg-primary-real-white w-[1440px] flex flex-col py-0 px-8 box-border items-center justify-start h-full">
        <Header />
        <Outlet/>
      </div>
    </div>
  );
}