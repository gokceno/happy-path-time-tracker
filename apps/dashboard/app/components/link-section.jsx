import { forwardRef, useImperativeHandle, useState } from 'react';

import { isValidUrl } from '../utils/funcs';

// eslint-disable-next-line react/display-name
const LinkSection = forwardRef(
  (
    { value, hideMinus, onAddLink, onRemoveLink, setIsNewInputVisible },
    ref
  ) => {
    const [newLink, setNewLink] = useState('');
    const [invalidUrl, setInvalidUrl] = useState(false);

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddLink();
      }
    };

    const handleAddLink = () => {
      if (isValidUrl(newLink)) {
        onAddLink(newLink);
        setNewLink('');
        setIsNewInputVisible(true);
      } else {
        setInvalidUrl(true);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        handleAddLink();
      },
    }));

    return (
      <div className="self-stretch flex flex-row items-center justify-center mb-1 relative">
        <input
          disabled={!!value}
          className="w-full font-primary-small-body-h5-semibold text-sm bg-[transparent] flex-1 rounded flex flex-row p-2 pr-8 items-center justify-start border-[1px] border-solid border-shades-of-cadet-gray-cadet-gray-200 
       disabled:border-shades-of-teal-teal-50 disabled:bg-shades-of-teal-teal-50 disabled:cursor-not-allowed disabled:hover:cursor-not-allowed"
          type="text"
          onChange={(event) => {
            setInvalidUrl(false);
            setNewLink(event.target.value);
          }}
          placeholder="https://"
          value={typeof value === 'string' ? value : value?.data?.title}
          onKeyDown={(e) => handleKeyPress(e)}
        />
        {invalidUrl && (
          <div className="absolute text-amber-800 right-8 rounded flex flex-row items-center justify-center ml-1 p-1">
            Invalid URL
          </div>
        )}

        {hideMinus && (
          <div
            onClick={handleAddLink}
            className="absolute right-1 rounded flex flex-row items-center justify-center ml-1 p-1 cursor-pointer hover:bg-shades-of-dark-04 "
          >
            <img
              className="relative w-5 h-5"
              alt="Add link"
              src="/prefix-icon2.svg"
            />
          </div>
        )}
        {!hideMinus && (
          <div
            onClick={onRemoveLink}
            className="absolute right-1 rounded flex flex-row items-center justify-center ml-1 p-1 cursor-pointer hover:bg-shades-of-dark-04 "
          >
            <img
              className="relative w-5 h-5"
              alt="Add link"
              src="/minus.svg"
            />
          </div>
        )}
      </div>
    );
  }
);

export default LinkSection;
