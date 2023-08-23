import { Link } from "@remix-run/react";

const StartNewTimerButton = ({ to }) => {
  return (
    <Link to={to} className="[text-decoration:none] rounded-9xl h-12 flex flex-row p-3 box-border items-center justify-center relative gap-[8px] text-left text-base text-shades-of-cadet-gray-cadet-gray-400 font-primary-small-body-h5-medium">
      <img
        className="relative w-6 h-6 overflow-hidden shrink-0 z-[0]"
        alt="Add project and start tracking"
        src="/prefix-icon2.svg"
      />
      <div className="relative leading-[133%] font-medium z-[1]">
        Add project and start tracking
      </div>
    </Link>
  );
};

export default StartNewTimerButton;
