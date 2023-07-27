const Avatar = () => {
  return (
    <div className="relative w-10 h-10 flex flex-row items-center justify-center">
      <img
        className="relative rounded-[50%] w-10 h-10 object-cover z-[0]"
        alt=""
        src="/bg@2x.png"
      />
    </div>
  );
};

export default Avatar;
