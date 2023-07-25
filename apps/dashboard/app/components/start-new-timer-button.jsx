const StartNewTimerButton = () => {
  return (
    <a
      className="[text-decoration:none] rounded-9xl h-12 flex flex-row p-3 box-border items-center justify-center relative gap-[8px] text-left text-base text-shades-of-cadet-gray-cadet-gray-400 font-primary-small-body-h5-medium"
      href="https://google.com"
    >
      <img
        className="relative w-6 h-6 overflow-hidden shrink-0 z-[0]"
        alt=""
        src="/prefix-icon2.svg"
      />
      <div className="relative leading-[133%] font-medium z-[1]">
        Add project and start tracking
      </div>
      <img
        className="relative w-6 h-6 overflow-hidden shrink-0 hidden z-[2]"
        alt=""
        src="/suffix-icon1.svg"
      />
      <div className="absolute my-0 mx-[!important] h-full w-full top-[0px] right-[0px] bottom-[0px] left-[0px] rounded-9xl bg-shades-of-dark-08 hidden z-[3]" />
    </a>
  );
};

export default StartNewTimerButton;
