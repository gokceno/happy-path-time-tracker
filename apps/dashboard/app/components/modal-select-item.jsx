import { Link } from "@remix-run/react";

String.prototype.ellipsis = function(n) {
  return this.substr(0, n-1) + (this.length > n ? '...' : '');
}

const ModalSelectItem = ({ to, title }) => {
  return (
    <div className="self-stretch h-9 flex flex-row py-0 px-6 box-border items-center justify-start">
      <div className="rounded bg-shades-of-teal-teal-50 flex flex-row py-0 px-2 items-center justify-start relative gap-[4px]">
        <div className="h-6 flex flex-row items-center justify-start z-[0]">
          <Link to={to} className="relative leading-[133%] text-primary-dark-night no-underline">
            {title.ellipsis(32)}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ModalSelectItem;
