import PeriodNavigation from "./period-navigation";
import Avatar from "./avatar";

const Header = ({ email }) => {
  return (
    <div className="self-stretch flex flex-row py-4 px-0 items-center justify-between">
      <a href="/">
        <img className="relative w-[38px]" alt="Happy Path" src="/hummingbird.png" />
      </a>
      <PeriodNavigation />
      <Avatar email={email} />
    </div>
  );
};

export default Header;
