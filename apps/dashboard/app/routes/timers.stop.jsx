import { json } from '@remix-run/node';
import { Client, fetchExchange, cacheExchange } from '@urql/core';

const TimersMutation = `
  mutation Stop($timerId: Int!) {
    stop(timerId: $timerId) {
      id
      startsAt
      endsAt
      totalDuration
    }
  }
`;

export const action = async ({ request }) => {
  const formData = await request.formData();
  const timerId = formData.get('timerId');
  const [authCookieName, authCookieValue] = (request.headers.get('Cookie') || '').split('=');
  if(authCookieValue == undefined) return redirect(process.env.LOGIN_URI || '/auth/login');
  const GraphQLClient = new Client({
    url: process.env.API_GRAPHQL_URL,
    exchanges: [fetchExchange, cacheExchange],
    fetchOptions: () => {
      return {
        headers: { authorization: 'Bearer ' + authCookieValue },
      };
    },
  });
  const response = await GraphQLClient.mutation(TimersMutation, { timerId: +timerId });
  if(response.error != undefined) {
    return json({ ok: false, error: response.error });
  }
  return json({ ok: true });
};