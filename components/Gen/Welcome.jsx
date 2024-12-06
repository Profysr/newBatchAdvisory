const WelcomeComponent = ({ username }) => {
  return (
    <div className="w-full flex justify-center items-center">
      <h1 className="text-2xl font-light text-center">
        Welcome <br />
        <span className="text-3xl font-semibold">{username} 👋</span>
      </h1>
    </div>
  );
};

export default WelcomeComponent;
