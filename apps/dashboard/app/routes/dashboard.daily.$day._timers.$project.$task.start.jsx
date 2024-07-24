import { Link, useFetcher, useParams } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { PatternFormat } from 'react-number-format';
import { DateTime, Duration } from 'luxon';
import { jwtVerify } from 'jose';
import {
  auth as authCookie,
  email as emailCookie,
  recentProjectTasks as recentProjectTasksCookie,
} from '~/utils/cookies.server';
import { redirect } from '@remix-run/node';
import { Frontend as GraphQLClient } from '@happy-path/graphql-client';
import { Timers } from '@happy-path/graphql-entities';
import LinkSection from '../components/link-section';
import { resolve as resolveRelations } from '~/utils/relations/resolve.js';

export const action = async ({ request }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  const email = await emailCookie.parse(request.headers.get('cookie'));
  try {
    const secret = new TextEncoder().encode(process.env.DIRECTUS_JWT_SECRET);
    await jwtVerify(token, secret);
  } catch (e) {
    return redirect('/logout');
  }
  const formData = await request.formData();
  const projectTaskId = formData.get('projectTaskId');
  const tempProject = formData.get('tempProject');
  const tempTask = formData.get('tempTask');
  const relations = JSON.parse(formData.get('relations'))?.map((i) => i) || [];
  const notes = formData.get('notes');
  const day = formData.get('day');
  const [hours, minutes] = formData.get('duration').split(':');

  const duration =
    hours && minutes
      ? Duration.fromObject({ hours, minutes }).as('minutes')
      : 0;

  let flash = [];

  const client = GraphQLClient({
    token,
    url: process.env.API_DIRECTUS_URL + '/graphql/',
  });

  try {
    const timerConfig = {
      projectTaskId,
      email,
      duration,
      relations: await resolveRelations({ relations }),
      taskComment: notes,
    };
    const timezone = process.env.TIMEZONE || 'UTC';
    if (DateTime.local({ timezone }).toISODate() == day) {
      await Timers({
        client,
        timezone,
      }).start(timerConfig);
      flash.push({
        message:
          "You started a timer. Don't forget to stop once you're done with it.",
      });
    } else {
      await Timers({
        client,
        timezone,
      }).log({
        startsAt: DateTime.fromISO(day, {
          zone: timezone,
        }).toISO(),
        endsAt: DateTime.fromISO(day, {
          zone: timezone,
        }).toISO(),
        ...timerConfig,
      });
      flash.push({ message: 'You logged your time. Thank you.' });
    }
  } catch (e) {
    flash.push({ message: e.message });
  }

  const updateArray = (arr, newObject) => {
    const existingObject = arr.find((obj) => obj.taskId === newObject.taskId);
    existingObject
      ? existingObject.count++
      : arr.push({ ...newObject, count: 1 });
    return arr;
  };
  const currentRecentProjects =
    (await recentProjectTasksCookie.parse(request.headers.get('cookie'))) || [];

  const newRecentProject = {
    projectId: JSON.parse(tempProject).id,
    projectName: JSON.parse(tempProject).title,
    taskId: JSON.parse(tempTask).id,
    taskName: JSON.parse(tempTask).title,
  };

  const updatedRecentProjectsArray = updateArray(
    currentRecentProjects,
    newRecentProject
  );

  return redirect(
    `/dashboard/daily/${day}?flash=${btoa(JSON.stringify(flash))}`,
    {
      headers: {
        'Set-Cookie': await recentProjectTasksCookie.serialize(
          updatedRecentProjectsArray
        ),
      },
    }
  );
};

export default function TimerStartRoute() {
  const { day, project, task } = useParams();
  const [tempProject, setTempProject] = useState('');
  const [tempTask, setTempTask] = useState('');

  const [links, setLinks] = useState([]);
  const [isNewInputVisible, setIsNewInputVisible] = useState(true);

  const onAddLink = value => value && setLinks([...links, value]);

  useEffect(() => {
    setTempProject(window.localStorage.getItem('project'));
    setTempTask(window.localStorage.getItem('task'));
  }, []);

  const childRef = useRef();

  const fetcher = useFetcher();
  return (
    <fetcher.Form
      method="post"
      className="self-stretch flex flex-col px-6 py-2 items-center justify-start z-[2] text-shades-of-cadet-gray-cadet-gray-600"
    >
      <input
        value={task}
        type="hidden"
        name="projectTaskId"
      />
      <input
        value={day}
        type="hidden"
        name="day"
      />
      <input
        value={tempProject}
        type="hidden"
        name="tempProject"
      />
      <input
        value={tempTask}
        type="hidden"
        name="tempTask"
      />
      <input
        type="hidden"
        name="relations"
        value={JSON.stringify(links)}
      />

      <div className="self-stretch flex flex-col items-center justify-start">
        <div className="self-stretch flex flex-row items-center justify-center">
          <textarea
            className="font-primary-small-body-h5-semibold text-sm w-full h-12 [outline:none] self-stretch text-primary-dark-night border-[1px] border-solid border-shades-of-cadet-gray-cadet-gray-200 p-4 rounded-lg leading-[133%]"
            name="notes"
            placeholder="Notes"
          />
        </div>
        <div className="self-stretch flex py-4 justify-start">
          Related Links
        </div>

        {links.map((value, index) => (
          <LinkSection
            key={index}
            value={value}
            onRemoveLink={() => {
              const newLinks = [...links];
              newLinks.splice(index, 1);
              setLinks(newLinks);
            }}
            onAddLink={onAddLink}
            setIsNewInputVisible={setIsNewInputVisible}
          />
        ))}

        {isNewInputVisible && (
          <LinkSection
            key={Math.random()}
            hideMinus={true}
            onRemoveLink={() => setIsNewInputVisible(true)}
            onAddLink={onAddLink}
            setIsNewInputVisible={setIsNewInputVisible}
            ref={childRef}
          />
        )}

        <div className="self-stretch mt-4 box-border h-12 flex flex-row items-center justify-center border-b-[1px] border-solid border-shades-of-cadet-gray-cadet-gray-200">
          <div className="rounded-lg flex flex-row py-1 px-2 items-center justify-center">
            <PatternFormat
              format="0#:##"
              isAllowed={({ formattedValue }) =>
                formattedValue.split(':')[0] <= 8 &&
                formattedValue.split(':')[1] <= 59
              }
              className="[border:none] [outline:none] font-space-mono text-3xl bg-[transparent] relative leading-[133%] text-primary-dark-night text-center"
              name="duration"
              placeholder="00:00 (optional)"
            />
          </div>
        </div>
      </div>
      <button
        onClick={async () => {
          await childRef.current?.submit();
          fetcher.submit();
        }}
        className="cursor-pointer [border:none] mt-3 p-3 bg-shades-of-teal-teal-300 self-stretch rounded-9xl h-12 flex flex-row box-border items-center justify-center relative gap-[8px]"
      >
        <div className="relative text-base leading-[133%] font-medium font-primary-small-body-h5-semibold text-primary-real-white text-left z-[2]">
          Start Tracking
        </div>
      </button>
      <div className="self-stretch rounded-lg flex flex-row pt-4 pb-0 items-center justify-start gap-[8px] z-[3]">
        <Link
          to={`/dashboard/daily/${day}/${project}/tasks`}
          className="rounded-9xl h-8 flex flex-row py-1 pr-2 pl-0 box-border items-center justify-center relative gap-[4px] text-shades-of-teal-teal-400"
        >
          <img
            className="relative w-6 h-6 overflow-hidden shrink-0 z-[0]"
            alt="Back to Tasks"
            src="/chevronleft.svg"
          />
          <div className="relative leading-[133%] z-[1]">Back to Tasks</div>
        </Link>
      </div>
    </fetcher.Form>
  );
}
