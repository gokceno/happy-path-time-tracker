const Avatar = ({ email, onClick }) => {
  return (
    <div className="relative w-10 h-10 flex flex-row items-center justify-center">
      <img
        className="relative rounded-[50%] w-10 h-10 object-cover z-[0] cursor-pointer"
        alt={`User avatar for ${email}`}
        src={`https://unavatar.io/${email}?fallback=https://source.boringavatars.com/beam/120/${email}`}
        onClick={onClick}
      />
    </div>
  );
};

export default Avatar;
