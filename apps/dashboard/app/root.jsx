import { cssBundleHref } from "@remix-run/css-bundle";
import styles from "./styles/app.css"
import Header from "./components/header";

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export const links = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: styles },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="relative bg-shades-of-cadet-gray-cadet-gray-900 w-[1440px] h-[944px]">
          <div className="absolute top-[0px] left-[0px] bg-primary-real-white w-[1440px] flex flex-col py-0 px-8 box-border items-center justify-start h-full">
            <Header />
            <Outlet/>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
