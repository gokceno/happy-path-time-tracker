const DayHeader = ({ title }) => {
  return (
    <div className="self-stretch flex flex-row items-center justify-start text-left text-base text-primary-dark-night font-primary-small-body-h5-medium">
      <div className="flex-1 h-8 flex flex-row items-center justify-start">
        <h2 className="m-0 relative text-[inherit] leading-[133%] font-medium font-inherit">
          {title}
        </h2>
      </div>
    </div>
  );
};

export default DayHeader;
