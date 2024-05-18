export const isValidUrl = (url) => {
    const expression = /(http:|https:)+[^\s]+[\w]/gi;
    const regex = new RegExp(expression);
    return regex.test(url);
  };
