import { Link, useSearchParams } from '@remix-run/react';

const StartNewTimerButton = ({
  to,
  isToday,
  hasRunningTimer,
  additionalTag,
}) => {
  let [searchParams, setSearchParams] = useSearchParams();
  const checkIfRunningTimer = (e) => {
    if (hasRunningTimer == true) {
      const flash = [
        { message: 'Please, stop your running timer to start a new one.' },
      ];
      setSearchParams({ flash: btoa(JSON.stringify(flash)) });
      e.preventDefault();
    }
  };
  return (
    <Link
      to={to}
      onClick={checkIfRunningTimer}
      className="[text-decoration:none] rounded-9xl h-12 flex flex-row p-3 box-border items-center justify-center relative gap-[8px] text-left text-base text-shades-of-cadet-gray-cadet-gray-400 font-primary-small-body-h5-medium"
    >
      <img
        className="relative w-6 h-6 overflow-hidden shrink-0 z-[0]"
        alt="Add project and start tracking"
        src="/prefix-icon2.svg"
      />
      {isToday == true ? (
        <div className="relative leading-[133%] font-medium z-[1]">
          Start a new timer {additionalTag && ` for ${additionalTag}`}
        </div>
      ) : (
        <div className="relative leading-[133%] font-medium z-[1]">
          Log your times {additionalTag && ` for ${additionalTag}`}
        </div>
      )}
    </Link>
  );
};

export default StartNewTimerButton;
