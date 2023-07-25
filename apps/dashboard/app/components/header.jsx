import PeriodNavigation from "./period-navigation";
import Avatar from "./avatar";

const Header = () => {
  return (
    <div className="self-stretch flex flex-row py-4 px-0 items-center justify-between">
      <img className="relative w-[38px]" alt="Happy Path" src="/hummingbird.png" />
      <PeriodNavigation />
      <Avatar />
    </div>
  );
};

export default Header;
