import { useParams, useLoaderData, Link } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { useState } from 'react';
import { Frontend as Client } from '@happy-path/graphql-client';
import { auth as authCookie } from '~/utils/cookies.server';
import ModalSelectItem from '~/components/modal-select-item';

const TasksQuery = `
  query Tasks($projectId: Int!) {
    tasks(projectId: $projectId) {
      id
      taskName
    }
  }
`;

export const loader = async ({ request, params }) => {
  const { token } = await authCookie.parse(request.headers.get('cookie')) || {};
  if(token == undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  const { day, project } = params;
  const response = await Client({ token }).query(TasksQuery, { projectId: +project });
  if(response.error != undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  return json({
    tasks: response?.data?.tasks || [],
  });
};

export default function TaskSelectRoute() {
  const { day, project } = useParams();
  const { tasks } = useLoaderData();
  const [filterBy, setFilterBy] = useState('');
  return (
    <div className="overflow-y-auto self-stretch flex flex-col items-center justify-start z-[2] text-shades-of-cadet-gray-cadet-gray-600">
      <div className="self-stretch rounded-lg flex flex-row py-0 px-6 items-center justify-start">
        <input
          className="font-primary-small-body-h5-semibold text-sm bg-[transparent] flex-1 rounded flex flex-row p-2 items-center justify-start border-[1px] border-solid border-shades-of-cadet-gray-cadet-gray-200"
          type="text"
          onChange={(event) => setFilterBy(event.target.value)}
          placeholder="Type to filter tasks"
        />
      </div>
      <div className="self-stretch flex flex-row pt-4 px-6 pb-2 items-center justify-start opacity-[0.8]">
        <div className="relative leading-[133%] font-semibold">
          Billable &amp; Non-billable Tasks
        </div>
      </div>
      <div className="self-stretch bg-primary-real-white flex flex-col items-start justify-start">
        { tasks.filter(task => task.taskName.toUpperCase().includes(filterBy.toUpperCase())).map(task =>   
          <ModalSelectItem key={task.id} to={`/dashboard/daily/${day}/${project}/${task.id}/start`} title={task.taskName}/>
        )}
      </div>
      <div className="self-stretch rounded-lg flex flex-row pt-4 px-5 pb-0 items-center justify-start gap-[8px] z-[3]">
        <Link to={`/dashboard/daily/${day}/projects`} className="rounded-9xl h-8 flex flex-row py-1 pr-2 pl-0 box-border items-center justify-center relative gap-[4px] text-shades-of-teal-teal-400">
          <img
            className="relative w-6 h-6 overflow-hidden shrink-0 z-[0]"
            alt="Back to Projects"
            src="/chevronleft.svg"
          />
          <div className="relative leading-[133%] z-[1]">
            Back to Projects
          </div>
        </Link>
      </div>
    </div>
  );
}
