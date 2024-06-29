import { useFetcher } from '@remix-run/react';
import { json } from '@remix-run/node';
import { Frontend as Client } from '@happy-path/graphql-client';
import { z } from 'zod';

export const meta = () => [{ title: 'Recover Account - Happy Path' }];

const RecoverMutation = `
  mutation PasswordResetRequest($email: String!) {
    auth_password_request(email: $email)
  }
`;

export const action = async ({ request }) => {
  const formData = await request.formData();
  try {
    const email = z.string().email().parse(formData.get('email'));
    const response = await Client({
      url: (process.env.API_DIRECTUS_URL || '') + '/graphql/system',
    }).mutation(RecoverMutation, {
      email,
    });
    return json({ ok: !!response.data.auth_password_request });
  } catch (e) {
    return json({ ok: false });
  }
};

const ForgotPassword = () => {
  const fetcher = useFetcher();
  return (
    <div className="relative font-primary-small-body-h5-medium bg-shades-of-cadet-gray-cadet-gray-50 w-full min-h-screen flex items-center">
      <div className="flex flex-col max-w-[340px] w-full m-auto items-center justify-center">
        <img
          className="relative w-[38px]"
          alt="Happy Path"
          src="/hummingbird.png"
        />
        <div className="flex flex-col justify-center p-8 bg-white mt-8 w-full rounded-lg">
          <h2 className="my-0 text-center text-xl font-semibold leading-9 tracking-tight text-primary-dark-night">
            Recover Account
          </h2>

          {fetcher.data?.ok === true && (
            <div
              className="mt-4 -mb-4 text-sm bg-green-100 border text-center border-green-400 text-green-700 px-4 py-4 rounded-lg relative"
              role="alert"
            >
              <strong className="font-semibold">Horaay!</strong>
              <br />
              <span>
                We sent a code to your email address. <br />
                Please check your inbox.
              </span>
            </div>
          )}

          {fetcher.data?.ok === false && (
            <div
              className="mt-4 -mb-4 text-sm bg-red-100 border text-center border-red-400 text-red-700 px-4 py-4 rounded-lg relative"
              role="alert"
            >
              <strong className="font-semibold">Holy smokes!</strong>
              <br />
              <span>
                An error occured, please try again. Contact the system administrator if the error
                persists.
              </span>
            </div>
          )}

          <div className="mt-8 w-full">
            <fetcher.Form
              method="post"
              action="/forgot-password"
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-6 text-gray-500"
                >
                  Email Address
                </label>
                <div className="mt-2 w-full">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full box-border first-letter:w-full font-primary-small-body-h5-semibold text-sm bg-[transparent] flex-1 rounded flex flex-row p-2 items-center justify-start border-[1px] border-solid border-shades-of-cadet-gray-cadet-gray-200 
       disabled:border-shades-of-teal-teal-50 disabled:bg-shades-of-teal-teal-50 disabled:cursor-not-allowed disabled:hover:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full cursor-pointer [border:none] mt-3 p-3 bg-shades-of-teal-teal-300 self-stretch rounded-9xl h-12 flex flex-row box-border items-center justify-center relative gap-[8px]"
                >
                  <div className="relative text-base leading-[133%] font-medium font-primary-small-body-h5-semibold text-primary-real-white text-left z-[2]">
                    Send me the code
                  </div>
                </button>
              </div>
            </fetcher.Form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <a
                href="/login"
                className="font-medium leading-6 text-shades-of-teal-teal-400 hover:opacity-70"
              >
                Back to login page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
