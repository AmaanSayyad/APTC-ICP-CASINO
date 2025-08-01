import React from "react";

/**
 * CoinIcon component - A reusable component for displaying the APT coin icon
 * @param {Object} props - Component props
 * @param {number} props.size - Size of the icon (default: 16)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
const CoinIcon = ({ size = 16, className = "" }) => {
  return (
    <img
      src="/coin.png"
      width={size}
      height={size}
      alt="APTC coin"
      className={`${className}`}
    />
  );
};

export default CoinIcon;
