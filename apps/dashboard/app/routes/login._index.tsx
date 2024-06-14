import { useState } from 'react';

const Login = () => {
  const [isInvalidAttempt, setIsInvalidAttempt] = useState(true);

  // make service call to validate user credentials
  // if valid, redirect to dashboard
  // if invalid, show error message with setIsInvalidAttempt(true)

  return (
    <div className="relative font-primary-small-body-h5-medium bg-shades-of-cadet-gray-cadet-gray-50 w-full min-h-screen flex items-center">
      <div className="flex flex-col max-w-[340px] w-full m-auto items-center justify-center">
        <img
          className="relative w-[38px]"
          alt="Happy Path"
          src="/hummingbird.png"
        />
        <div className="flex flex-col justify-center p-8 bg-white mt-8 w-full rounded-lg">
          <h2 className="my-0 text-center text-xl font-emibold leading-9 tracking-tight text-gray-500">
            Sign in to your account
          </h2>

          {isInvalidAttempt && (
            <div
              className="mt-4 -mb-4 text-sm bg-red-100 border text-center border-red-400 text-red-700 px-4 py-4 rounded-lg relative"
              role="alert"
            >
              <strong className="font-semibold">Holy smokes!</strong>
              <br />
              <span>
                Invalid login credentials. Please try again.
              </span>
            </div>
          )}

        
          <div className="mt-8 w-full">
            <form
              className="space-y-6"
              action="#"
              method="POST"
            >
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-6 text-gray-500"
                >
                  Email address
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
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium leading-6 text-gray-500"
                  >
                    Password
                  </label>
                  <div className="text-sm">
                    <a
                      href="/forgot-password"
                      className="font-medium text-shades-of-teal-teal-400  hover:opacity-70"
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full box-border first-letter:w-full font-primary-small-body-h5-semibold text-sm bg-[transparent] flex-1 rounded flex flex-row p-2 items-center justify-start border-[1px] border-solid border-shades-of-cadet-gray-cadet-gray-200 
                    disabled:border-shades-of-teal-teal-50 disabled:bg-shades-of-teal-teal-50 disabled:cursor-not-allowed disabled:hover:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <button className="w-full cursor-pointer [border:none] mt-3 p-3 bg-shades-of-teal-teal-300 self-stretch rounded-9xl h-12 flex flex-row box-border items-center justify-center relative gap-[8px]">
                  <div className="relative text-base leading-[133%] font-medium font-primary-small-body-h5-semibold text-primary-real-white text-left z-[2]">
                    Sign in
                  </div>
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Not a member?
              <br />
              <a
                href="#"
                className="font-medium leading-6 text-shades-of-teal-teal-400 hover:opacity-70"
              >
                Start a 14 day free trial
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
