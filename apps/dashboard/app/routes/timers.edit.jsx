import { Frontend as Client } from '@happy-path/graphql-client';
import { Duration } from 'luxon';
import { auth as authCookie } from '~/utils/cookies.server';
import { redirect } from '@remix-run/node';

const EditMutation = `
  mutation Update($timerId: Int!, $duration: Int!, $startsAt: String, $endsAt: String, $notes: String!, $relations: [String]) {
    update(timerId: $timerId, input: { duration: $duration, notes: $notes, startsAt: $startsAt, endsAt: $endsAt, relations: $relations}) {
      id
    }
  }
`;

export const action = async ({ request }) => {
  const { token } =
    (await authCookie.parse(request.headers.get('cookie'))) || {};
  if (token == undefined)
    return redirect(process.env.LOGIN_URI || '/auth/login');

  const formData = await request.formData();

  const timerIdInput = formData.get('timerId');
  const durationInput = formData.get('duration');
  const startsAtInput = formData.get('startsAt');
  const endsAtInput = formData.get('endsAt');
  const notesInput = formData.get('notes');
  const relations = JSON.parse(formData.get('relations'))?.map((i) => i) || [];
  const day = formData.get('day');

  const [hours, minutes] = durationInput.split(':');
  const duration =
    hours && minutes
      ? Duration.fromObject({ hours, minutes }).as('minutes')
      : 0;

  const response = await Client({ token }).mutation(EditMutation, {
    timerId: +timerIdInput,
    startsAt: startsAtInput || null,
    endsAt: endsAtInput || null,
    duration,
    relations,
    notes: notesInput || null,
  });

  let flash = [];

  response.error != undefined
    ? flash.push({ message: response.error })
    : flash.push({ message: 'You edited your time entry. Good job!' });

  return redirect(
    `/dashboard/daily/${day}?flash=${btoa(JSON.stringify(flash))}`
  );
};
