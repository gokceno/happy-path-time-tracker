const NoTimeEntry = () => {
  return (
    <div className="self-stretch rounded-2xl bg-shades-of-cadet-gray-cadet-gray-50 flex flex-col p-8 items-start justify-center gap-[32px] text-left text-base text-primary-dark-night font-primary-body-h4-p-reguar">
      <img
        className="relative w-40 h-40 overflow-hidden shrink-0"
        alt="No time entries"
        src="/no-time-entry.svg"
      />
      <div className="flex flex-col items-start justify-center gap-[32px]">
        <div className="self-stretch flex flex-col items-start justify-start gap-[16px]">
          <h4 className="m-0 self-stretch relative text-[inherit] leading-[133%] font-medium font-inherit text-shades-of-cadet-gray-cadet-gray-600">
            You don't have any time entries for today. Use the button below to start a new timer.
            <p>Or you can head back to Slack or <a className="text-shades-of-cadet-gray-cadet-gray-600" target="_blank" href="https://github.com/BrewInteractive/happy-path-macos-client/releases">download the MacOS app</a> to start a new timer. Your options are limitless 😀</p>
          </h4>
        </div>
      </div>
    </div>
  );
};

export default NoTimeEntry;
