import TimeEntry from "./time-entry";

const ClientContainer = ({ clientName, timers }) => {
  return (
    <div className="self-stretch rounded-2xl bg-shades-of-cadet-gray-cadet-gray-50 flex flex-col py-4 px-0 items-start justify-start text-left text-lgi text-primary-dark-night font-primary-small-body-h5-medium">
      <div className="self-stretch rounded-29xl h-12 flex flex-row py-2 px-6 box-border items-center justify-start">
        <div className="relative leading-[133%]">{clientName}</div>
      </div>
      <div className="flex flex-col items-start justify-center text-sm">
        {timers.map((timer) => (timer.project.name == clientName ? 
          <TimeEntry
            key={timer.id}
            taskName={timer.task.name}
            timeEntryDescription={timer.notes}
            taskDuration={timer.totalDuration}
          /> : null
        ))}
      </div>
    </div>
  );
};

export default ClientContainer;
