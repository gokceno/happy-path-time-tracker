const Avatar = () => {
  return (
    <div className="relative w-10 h-10 flex flex-row items-center justify-center">
      <img
        className="relative rounded-[50%] w-10 h-10 object-cover z-[0]"
        alt=""
        src="/bg@2x.png"
      />
      <div className="absolute my-0 mx-[!important] top-[0px] left-[0px] rounded-[50%] bg-shades-of-dark-16 w-10 h-10 hidden z-[1]" />
      <div className="my-0 mx-[!important] absolute top-[30px] left-[30px] rounded-lg bg-secondary-coral w-2 h-2 z-[2]" />
    </div>
  );
};

export default Avatar;
