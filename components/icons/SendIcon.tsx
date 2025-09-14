import React from 'react';

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="12" cy="12" r="11" fill="white" stroke="none" />
    <g fill="black">
        <rect x="11.25" y="7" width="1.5" height="10" rx="0.75" />
        <rect x="8.25" y="9" width="1.5" height="6" rx="0.75" />
        <rect x="14.25" y="9" width="1.5" height="6" rx="0.75" />
        <rect x="5.25" y="11" width="1.5" height="2" rx="0.75" />
        <rect x="17.25" y="11" width="1.5" height="2" rx="0.75" />
    </g>
  </svg>
);

export default SendIcon;
