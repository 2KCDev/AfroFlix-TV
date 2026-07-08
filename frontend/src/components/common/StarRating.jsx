import React, { useState } from 'react';
import { FiStar } from 'react-icons/fi';

const StarRating = ({ rating = 0, interactive = false, onRate = null, size = 20, disabled = false }) => {
  const [hover, setHover] = useState(0);
  
  const handleClick = (value) => {
    if (interactive && !disabled && onRate) {
      onRate(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`transition ${
            interactive && !disabled ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          } ${disabled ? 'opacity-60' : ''}`}
          disabled={!interactive || disabled}
        >
          <FiStar
            size={size}
            className={`${
              star <= (hover || rating)
                ? 'fill-orange-400 text-orange-400'
                : 'text-gray-300'
            } transition`}
          />
        </button>
      ))}
      {rating > 0 && !interactive && (
        <span className="ml-2 text-sm font-semibold text-gray-700">
          {rating.toFixed(1)} / 5
        </span>
      )}
    </div>
  );
};

export default StarRating;
