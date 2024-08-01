import { Duration } from 'luxon';
import TimeEntry from './time-entry';
import { useMemo } from 'react';

const ClientContainer = ({ clientName, timers, timezone }) => {
  const totalDuration = timers.reduce((acc, timer) => {
    if (timer.project.name == clientName) {
      return acc + timer.totalDuration;
    }
    return acc;
  }, 0);

  const hasTimersSingleProjectType = (data) => {
    if (data.length <= 1) return true;

    const projectIds = new Set();

    for (const item of data) {
      projectIds.add(item.project.id);
      if (projectIds.size > 1) return false;
    }

    return true;
  };

  const isTotalDurationVisible = useMemo(() => {
    return (
      timers.filter((timer) => timer.project.name == clientName).length > 1 &&
      !hasTimersSingleProjectType(timers)
    );
  }, [timers, clientName]);

  return timers.length > 0 ? (
    <div className="self-stretch rounded-2xl bg-shades-of-cadet-gray-cadet-gray-50 flex flex-col py-4 px-0 items-start justify-start text-left text-lgi text-primary-dark-night font-primary-small-body-h5-medium">
      <div className="self-stretch rounded-29xl h-12 flex flex-row py-2 px-6 box-border items-center justify-between">
        <div className="relative leading-[133%]">{clientName}</div>
        {isTotalDurationVisible && (
          <div className="flex flex-row items-center text-right">
            <span className="relative text-base leading-[133%] font-roboto-mono text-shades-of-cadet-gray-cadet-gray-500 text-right">
              {Duration.fromObject({ minutes: totalDuration }).toFormat(
                'hh:mm'
              )}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-start justify-center text-sm">
        {timers.map((timer) =>
          timer.project.name == clientName ? (
            <TimeEntry
              key={timer.id}
              timerId={timer.id}
              startsAt={timer.startsAt}
              taskName={timer.task.name}
              timeEntryDescription={timer.notes}
              duration={timer.totalDuration}
              isRunning={timer.endsAt == undefined}
              timezone={timezone}
              relations={timer.relations}
            />
          ) : null
        )}
      </div>
    </div>
  ) : (
    ''
  );
};

export default ClientContainer;
