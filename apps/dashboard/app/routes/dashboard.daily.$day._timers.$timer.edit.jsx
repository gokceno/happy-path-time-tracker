import { Link, useFetcher, useLoaderData, useParams } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { useRef, useState } from 'react';

import { Duration } from 'luxon';
import { Frontend as GraphQLClient } from '@happy-path/graphql-client';
import LinkSection from '../components/link-section';
import { PatternFormat } from 'react-number-format';
import { Timers } from '@happy-path/graphql-entities';
import { auth as authCookie } from '~/utils/cookies.server';
import { calculateDuration } from '@happy-path/calculator';
import { jwtVerify } from 'jose';
import { resolve as resolveRelations } from '~/utils/relations/resolve.js';

export const loader = async ({ request, params }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  try {
    const secret = new TextEncoder().encode(process.env.DIRECTUS_JWT_SECRET);
    await jwtVerify(token, secret);
  } catch (e) {
    return redirect('/logout');
  }
  const { timer: timerId } = params;

  const client = GraphQLClient({
    token,
    url: process.env.API_DIRECTUS_URL + '/graphql/',
  });

  const timer = await Timers({
    client,
    timezone: process.env.TIMEZONE || 'UTC',
  }).get({
    timerId,
  });

  return json({
    timer: {
      id: timer.data.id,
      relations: timer.data.relations,
      startsAt: timer.data.starts_at,
      endsAt: timer.data.ends_at,
      notes: timer.data.notes,
      duration: timer.data.duration,
    },
  });
};

export const action = async ({ request }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  if (token == undefined) return redirect('/login');

  const formData = await request.formData();

  const timerId = formData.get('timerId');
  const durationInput = formData.get('duration');
  const startsAt = formData.get('startsAt') || null;
  const endsAt = formData.get('endsAt') || null;
  const notesInput = formData.get('notes');
  const relations = JSON.parse(formData.get('relations'))?.map((i) => i) || [];
  const day = formData.get('day');
  const [hours, minutes] = durationInput.split(':');
  const duration =
    hours && minutes
      ? Duration.fromObject({ hours, minutes }).as('minutes')
      : 0;

  let flash = [];

  const timezone = process.env.TIMEZONE || 'UTC';
  const client = GraphQLClient({
    token,
    url: process.env.API_DIRECTUS_URL + '/graphql/',
  });

  const { totalDuration, totalDurationInHours } = calculateDuration({
    startsAt,
    endsAt,
    duration,
  });

  try {
    await Timers({
      client,
      timezone,
    }).update({
      timerId,
      data: {
        startsAt,
        endsAt,
        duration,
        totalDuration,
        totalDurationInHours,
        relations: await resolveRelations({ relations }),
        taskComment: notesInput || null,
      },
    });
    flash.push({ message: 'Time entry updated. Good job!' });
  } catch (e) {
    flash.push({ message: e.message });
  }
  return redirect(
    `/dashboard/daily/${day}?flash=${btoa(JSON.stringify(flash))}`
  );
};

export default function TimerStartRoute() {
  const { day } = useParams();
  const { timer } = useLoaderData();
  const fetcher = useFetcher();

  const [links, setLinks] = useState(timer.relations);
  const [isNewInputVisible, setIsNewInputVisible] = useState(true);

  const onAddLink = (value) =>
    value && setLinks((prevLinks) => [...prevLinks, value]);

  const childRef = useRef();

  return (
    <fetcher.Form
      method="post"
      className="self-stretch flex flex-col px-6 py-2 items-center justify-start z-[2] text-shades-of-cadet-gray-cadet-gray-600"
    >
      <input
        value={timer.id}
        type="hidden"
        name="timerId"
      />
      <input
        value={day}
        type="hidden"
        name="day"
      />
      <input
        value={timer.startsAt}
        type="hidden"
        name="startsAt"
      />
      <input
        value={timer.endsAt}
        type="hidden"
        name="endsAt"
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
            defaultValue={timer?.notes || ''}
            placeholder={!timer?.notes ? 'Notes' : ''}
          />
        </div>

        <div className="self-stretch flex py-4 justify-start">
          Related Links {links?.length > 0 && `(${links.length})`}
        </div>

        <div className="self-stretch max-h-32 overflow-y-auto flex flex-col">
          {links?.map((value, index) => (
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
        </div>

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
              defaultValue={
                Duration.fromObject({ minutes: timer?.duration }).toFormat(
                  'hh:mm'
                ) || '00:00'
              }
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
          Save Changes
        </div>
      </button>
      <div className="self-stretch rounded-lg flex flex-row pt-4 pb-0 items-center justify-start gap-[8px] z-[3]   justify-center">
        <Link
          to={`/timers/remove/${day}/${timer.id}`}
          className="rounded-9xl h-8 flex flex-row py-1 pr-2 pl-0 box-border items-center justify-center relative gap-[4px] text-shades-of-teal-teal-400"
        >
          <div className="color-red relative leading-[133%] z-[1]">
            Remove Time Entry
          </div>
        </Link>
      </div>
    </fetcher.Form>
  );
}
