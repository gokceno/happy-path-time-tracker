import { Link, useSearchParams } from '@remix-run/react';

const StartNewTimerButton = ({
  to,
  isToday,
  hasRunningTimer,
  additionalTag,
  projectTask,
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

    // Set project and task in local storage if projectTask is defined
    // It means that the button is a recent projectTask button
    if (projectTask) {
      window &&
        window.localStorage.setItem(
          'project',
          JSON.stringify({
            title: projectTask.projectName,
            id: projectTask.projectId,
          })
        );

      window &&
        window.localStorage.setItem(
          'task',
          JSON.stringify({
            title: projectTask.taskName,
            id: projectTask.taskId,
          })
        );
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
          Start a new timer{' '}
          {additionalTag && (
            <span
              dangerouslySetInnerHTML={{
                __html: ` for <span class="text-orange-400">${additionalTag}</span>`,
              }}
            />
          )}
        </div>
      ) : (
        <div className="relative leading-[133%] font-medium z-[1]">
          Log your times{' '}
          {additionalTag && (
            <span
              dangerouslySetInnerHTML={{
                __html: ` for <span class="text-orange-400">${additionalTag}</span>`,
              }}
            />
          )}
        </div>
      )}
    </Link>
  );
};

export default StartNewTimerButton;
