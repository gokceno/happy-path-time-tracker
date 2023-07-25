import TotalTimeCounter from "./total-time-counter";

const SectionHeader = ({ sectionTitle, totalDuration }) => {
  return (
    <div className="self-stretch flex flex-row items-center justify-start gap-[8px] text-left text-4xl text-primary-dark-night font-primary-small-body-h5-medium">
      <div className="flex-1 flex flex-row items-end justify-between">
        <h2 className="m-0 relative text-[inherit] leading-[133%] font-medium font-inherit">
          {sectionTitle}
        </h2>
      </div>
      <TotalTimeCounter totalDuration={totalDuration} />
    </div>
  );
};

export default SectionHeader;
