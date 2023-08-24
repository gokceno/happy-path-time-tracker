import { json, redirect } from '@remix-run/node';
import { Duration } from 'luxon';
import { Frontend as Client } from '@happy-path/graphql-client';
import { auth as authCookie } from '~/utils/cookies.server';

const StartMutation = `
  mutation Start($projectTaskId: Int!, $duration: Int, $notes: String) {
    start(projectTaskId: $projectTaskId, duration: $duration, notes: $notes) {
      id
    }
  }
`;

export const action = async ({ request }) => {
  const { token } = await authCookie.parse(request.headers.get('cookie')) || {};
  if(token == undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  
  const formData = await request.formData();

  const projectTaskIdInput = formData.get('projectTaskId');
  const durationInput = formData.get('duration');
  const notesInput = formData.get('notes');
  const day = formData.get('day');

  const [ hours, minutes ] = durationInput.split(':');
  const duration = (hours && minutes) ? Duration.fromObject({ hours, minutes }).as('minutes') : 0;
  const response = await Client({ token }).mutation(StartMutation, {
    projectTaskId: +projectTaskIdInput,
    duration,
    notes: notesInput,
  });
  if(response.error != undefined) {
    return json({ ok: false, error: response.error });
  }
  return redirect(`/dashboard/daily/${day}`);
};