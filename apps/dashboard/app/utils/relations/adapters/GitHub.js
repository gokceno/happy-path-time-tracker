export const adapter = () => {
  const vendor = 'GitHub';
  const matchers = [
    /github\.brewww\.net/,
  ];
  const get = () => {
    return {
      title: "Deneme",
      vendorId: "BREW-1234",
    };
  };
  return {
    vendor,
    matchers,
    get,
  };
};