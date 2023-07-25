import { Duration} from 'luxon';

const TotalTimeCounter = ({ totalDuration }) => {
  return (
    <div className="relative text-3xl leading-[133%] font-roboto-mono text-primary-dark-night text-right">
      {Duration.fromObject({ minutes: totalDuration }).toFormat('hh:mm')}
    </div>
  );
};

export default TotalTimeCounter;
