import React from "react";

export default function TextFieldCurrency({
  value,
  onChange,
  className,
  ...props
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-[#250020] border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-magic focus:outline-none ${className}`}
      min="0"
      step="0.01"
      {...props}
    />
  );
}
