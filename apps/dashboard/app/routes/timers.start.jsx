import { DateTime, Duration } from 'luxon';
import {
  auth as authCookie,
  recentProjectTasks as recentProjectTasksCookie,
} from '~/utils/cookies.server';
import { json, redirect } from '@remix-run/node';

import { Frontend as Client } from '@happy-path/graphql-client';

const StartMutation = `
  mutation Start($projectTaskId: Int!, $duration: Int, $notes: String, $relations: [String]) {
    start(projectTaskId: $projectTaskId, duration: $duration, notes: $notes, relations: $relations) {
      id
    }
  }
`;

const LogMutation = `
  mutation Log($projectTaskId: Int!, $duration: Int, $notes: String, $startsAt: String!, $endsAt: String!, $relations: [String]) {
    log(projectTaskId: $projectTaskId, duration: $duration, notes: $notes, startsAt: $startsAt, endsAt: $endsAt, relations: $relations) {
      id
    }
  }
`;

export const action = async ({ request }) => {
  const token = await authCookie.parse(request.headers.get('cookie'));
  if (token == undefined) return redirect('/login');

  const formData = await request.formData();
  const projectTaskIdInput = formData.get('projectTaskId');
  const tempProject = formData.get('tempProject');
  const tempTask = formData.get('tempTask');
  const relations = JSON.parse(formData.get('relations'))?.map((i) => i) || [];

  const durationInput = formData.get('duration');
  const notesInput = formData.get('notes');
  const day = formData.get('day');

  const [hours, minutes] = durationInput.split(':');
  const duration =
    hours && minutes
      ? Duration.fromObject({ hours, minutes }).as('minutes')
      : 0;

  let flash = [];

  if (
    DateTime.local({ timezone: process.env.TIMEZONE || 'UTC' }).toISODate() ==
    day
  ) {
    const response = await Client({ token }).mutation(StartMutation, {
      projectTaskId: +projectTaskIdInput,
      duration,
      notes: notesInput,
      relations,
    });
    if (response.error != undefined) {
      return json({ ok: false, error: response.error });
    }
    flash = [
      {
        message:
          "You started a timer. Don't forget to stop once you're done with it.",
      },
    ];
  } else {
    const response = await Client({ token }).mutation(LogMutation, {
      projectTaskId: +projectTaskIdInput,
      duration,
      notes: notesInput,
      relations,
      startsAt: DateTime.fromISO(day, {
        zone: process.env.TIMEZONE || 'UTC',
      }).toISO(),
      endsAt: DateTime.fromISO(day, {
        zone: process.env.TIMEZONE || 'UTC',
      }).toISO(),
    });
    if (response.error != undefined) {
      return json({ ok: false, error: response.error });
    }
    flash = [{ message: 'You logged your time. Thank you.' }];
  }

  const updateArray = (arr, newObject) => {
    // Check if there is an object with the same taskId
    const existingObject = arr.find((obj) => obj.taskId === newObject.taskId);

    if (existingObject) {
      // If id exists, increment the count
      existingObject.count++;
    } else {
      // If id does not exist, add the new object to the array
      arr.push({
        ...newObject,
        count: 1,
      });
    }

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
