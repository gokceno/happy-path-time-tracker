import { Duration} from 'luxon';

String.prototype.ellipsis = function(n) {
  return this.substr(0, n-1) + (this.length > n ? '...' : '');
}

const TimeEntry = ({ taskName, timeEntryDescription, duration, isRunning }) => {
  return (
    <div className="w-[670px] flex flex-row py-0 px-6 box-border items-center justify-between text-left text-sm text-primary-dark-night font-primary-small-body-h5-medium">
      <div className="rounded-lg flex flex-row py-2 px-0 items-center justify-start gap-[4px]">
        <div className="rounded bg-shades-of-teal-teal-50 flex flex-row py-0 px-2 items-center justify-start relative gap-[4px]">
          <div className="h-6 flex flex-row items-center justify-start z-[0]">
            <div className="relative leading-[133%]">{taskName}</div>
          </div>
        </div>
        <button className="cursor-pointer [border:none] py-1 px-2 bg-[transparent] rounded-9xl h-8 flex flex-row box-border items-center justify-center relative gap-[8px]">
          <div className="relative text-sm leading-[133%] font-medium font-primary-small-body-h5-medium text-shades-of-cadet-gray-cadet-gray-400 text-left z-[1]">
            {timeEntryDescription.ellipsis(48)}
          </div>
        </button>
      </div>
      <div className="flex flex-row items-center justify-end gap-[8px] text-shades-of-cadet-gray-cadet-gray-500 font-roboto-mono">
        <div className="flex flex-col py-1 px-2 items-start justify-start">
          <div className="relative leading-[133%]">{Duration.fromObject({ minutes: duration }).toFormat('hh:mm')}</div>
        </div>
        <div className="rounded-81xl bg-shades-of-dark-04 w-8 h-8 flex flex-row py-[7px] pr-[7px] pl-2.5 box-border items-center justify-center">
          { isRunning ? 
          <img
            className="relative rounded-12xs w-[12.09px] h-[14.42px]"
            alt="Pause"
            src="/pause.svg"
          />
          : 
          <img
            className="relative rounded-12xs w-[12.09px] h-[14.42px]"
            alt="Start"
            src="/play.svg"
          />
        }
        </div>
      </div>
    </div>
  );
};

export default TimeEntry;
