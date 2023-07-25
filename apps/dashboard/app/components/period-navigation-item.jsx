const PeriodNavigationItem = ({ label }) => {
  return (
    <button className="cursor-pointer [border:none] py-2 px-4 bg-[transparent] rounded-lg h-12 flex flex-row box-border items-center justify-center relative gap-[8px]">
      <img
        className="relative w-6 h-6 overflow-hidden shrink-0 hidden z-[0]"
        alt=""
        src="/prefix-icon1.svg"
      />
      <div className="relative text-base leading-[133%] font-medium font-primary-small-body-h5-medium text-primary-dark-night text-left z-[1]">
        {label}
      </div>
      <img
        className="relative w-6 h-6 overflow-hidden shrink-0 hidden z-[2]"
        alt=""
        src="/suffix-icon1.svg"
      />
      <div className="absolute my-0 mx-[!important] h-full w-full top-[0px] right-[0px] bottom-[0px] left-[0px] rounded-9xl bg-shades-of-dark-08 hidden z-[3]" />
    </button>
  );
};

export default PeriodNavigationItem;
