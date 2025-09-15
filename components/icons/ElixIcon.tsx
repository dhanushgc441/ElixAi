import React from 'react';

const ElixIcon = ({ className }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
    >
        <defs>
            <linearGradient id="elix-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="#1e1e1e" />
        <path 
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" 
            stroke="url(#elix-icon-gradient)" 
            strokeWidth="1.5"
        />
        <path 
            d="M15.5 12H8.5M12.5 8.5H8.5M12.5 15.5H8.5" 
            stroke="url(#elix-icon-gradient)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);

export default ElixIcon;
