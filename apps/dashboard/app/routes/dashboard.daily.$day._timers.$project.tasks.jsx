import { Link, useLoaderData, useParams } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { Frontend as GraphQLClient } from '@happy-path/graphql-client';
import { Projects, Tasks, Metadata } from '@happy-path/graphql-entities';
import { metadata as parseMetadata } from '@happy-path/calculator';
import ModalSelectItem from '~/components/modal-select-item';
import { auth as authCookie } from '~/utils/cookies.server';
import { useState } from 'react';

export const loader = async ({ request, params }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  if (token == undefined) return redirect('/login');
  const { project: projectId } = params;
  const client = GraphQLClient({
    token,
    url: process.env.API_DIRECTUS_URL + '/graphql/',
  });
  const tasks = await Tasks({
    client,
    queryParams: { projectId },
  }).list();
  const project = await Projects({ client }).findProjectById({
    projectId,
  });
  const metadata = await Metadata({ client }).get();
  const { groups, task_modifiers: taskModifiers } = parseMetadata([
    metadata,
    project.metadata,
  ]);
  let tasksToFilter = [];
  if (taskModifiers?.deny_list !== undefined) {
    const { deny_list: denyList } = taskModifiers;
    denyList
      .filter(
        (deny) =>
          deny.groups.filter((deniedGroup) => {
            const filteredGroups = groups.filter((group) => {
              return (
                (group[deniedGroup]?.members || []).indexOf(
                  'gokcen@brewww.com'
                ) !== -1
              );
            });
            return (
              filteredGroups.length > 0 &&
              Object.keys(filteredGroups[0]).includes(deniedGroup)
            );
          }).length
      )
      .map((deny) => tasksToFilter.push(...deny.tasks));
  }
  return json({
    tasks: tasks
      .filter((item) => !tasksToFilter.includes(item.tasks_id.task_name))
      .map((item) => ({ id: item.id, taskName: item.tasks_id.task_name })),
  });
};

export default function TaskSelectRoute() {
  const { day, project } = useParams();
  const { tasks } = useLoaderData();
  const [filterBy, setFilterBy] = useState('');

  return (
    <div className="overflow-y-auto max-h-96 self-stretch flex flex-col items-center justify-start z-[2] text-shades-of-cadet-gray-cadet-gray-600">
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
        {tasks
          .filter((task) =>
            task.taskName.toUpperCase().includes(filterBy.toUpperCase())
          )
          .map((task) => (
            <ModalSelectItem
              key={task.id}
              id={task.id}
              to={`/dashboard/daily/${day}/${project}/${task.id}/start`}
              title={task.taskName}
              type="task"
            />
          ))}
      </div>
      <div className="self-stretch rounded-lg flex flex-row pt-4 px-5 pb-0 items-center justify-start gap-[8px] z-[3]">
        <Link
          to={`/dashboard/daily/${day}/projects`}
          className="rounded-9xl h-8 flex flex-row py-1 pr-2 pl-0 box-border items-center justify-center relative gap-[4px] text-shades-of-teal-teal-400"
        >
          <img
            className="relative w-6 h-6 overflow-hidden shrink-0 z-[0]"
            alt="Back to Projects"
            src="/chevronleft.svg"
          />
          <div className="relative leading-[133%] z-[1]">Back to Projects</div>
        </Link>
      </div>
    </div>
  );
}
