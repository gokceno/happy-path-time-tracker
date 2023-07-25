import { redirect, LoaderFunction } from "@remix-run/node";

export const loader = async () => {
  return redirect('/dashboard/daily/');
};