import { Link } from "@remix-run/react";

const PeriodNavigationItem = ({ label, to, isActive }) => {
  return (
    <Link to={to} className="no-underline cursor-pointer [border:none] py-2 px-4 bg-[transparent] rounded-lg h-12 flex flex-row box-border items-center justify-center relative gap-[8px]">
      <div className={`${isActive ? 'text-primary-dark-night' : 'text-shades-of-cadet-gray-cadet-gray-400'} relative text-base leading-[133%] font-medium font-primary-small-body-h5-medium text-left z-[1]`}>
        {label}
      </div>
    </Link>
  );
};

export default PeriodNavigationItem;
