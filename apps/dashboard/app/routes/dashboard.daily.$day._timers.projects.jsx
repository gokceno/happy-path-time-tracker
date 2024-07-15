import { json, redirect } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';
import { jwtVerify } from 'jose';
import { Frontend as GraphQLClient } from '@happy-path/graphql-client';
import { Projects } from '@happy-path/graphql-entities';
import ModalSelectItem from '~/components/modal-select-item';
import { auth as authCookie } from '~/utils/cookies.server';
import { useState } from 'react';

export const loader = async ({ request }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  try {
    const secret = new TextEncoder().encode(process.env.DIRECTUS_JWT_SECRET);
    await jwtVerify(token, secret);
  } catch (e) {
    return redirect('/logout');
  }
  const client = GraphQLClient({
    token,
    url: process.env.API_DIRECTUS_URL + '/graphql/',
  });
  const projects = Projects({ client });
  return json({
    projects: (await projects.list()).map((item) => ({
      id: item.id,
      projectName: item.project_name,
    })),
  });
};

export default function ProjectSelectRoute() {
  const params = useParams();
  const { projects } = useLoaderData();
  const [filterBy, setFilterBy] = useState('');
  return (
    <div className="overflow-y-auto max-h-96 self-stretch flex flex-col items-center justify-start z-[2] text-shades-of-cadet-gray-cadet-gray-600">
      <div className="self-stretch rounded-lg flex flex-row py-0 px-6 items-center justify-start">
        <input
          className="font-primary-small-body-h5-semibold text-sm bg-[transparent] flex-1 rounded flex flex-row p-2 items-center justify-start border-[1px] border-solid border-shades-of-cadet-gray-cadet-gray-200"
          type="text"
          onChange={(event) => setFilterBy(event.target.value)}
          placeholder="Type to filter projects"
        />
      </div>
      <div className="self-stretch flex flex-row pt-4 px-6 pb-2 items-center justify-start opacity-[0.8]">
        <div className="relative leading-[133%] font-semibold">
          Below are your projects, which you have access to
        </div>
      </div>
      <div className="self-stretch bg-primary-real-white flex flex-col items-start justify-start">
        {projects
          .filter((project) =>
            project.projectName.toUpperCase().includes(filterBy.toUpperCase())
          )
          .map((project) => (
            <ModalSelectItem
              key={project.id}
              id={project.id}
              to={`/dashboard/daily/${params.day}/${project.id}/tasks`}
              title={project.projectName}
              type="project"
            />
          ))}
      </div>
    </div>
  );
}
