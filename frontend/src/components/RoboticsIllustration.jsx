import React from 'react';
import './RoboticsIllustration.css';

export default function RoboticsIllustration() {
  return (
    <svg
      viewBox="0 0 400 300"
      className="robotics-illustration"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Robot Head */}
      <g className="robot-head">
        <rect x="140" y="50" width="120" height="100" rx="10" fill="#FF6B35" filter="url(#glow)" />
        
        {/* Eyes */}
        <circle cx="165" cy="85" r="12" fill="#00D9FF" className="eye-left" filter="url(#glow)" />
        <circle cx="235" cy="85" r="12" fill="#00D9FF" className="eye-right" filter="url(#glow)" />
        
        {/* Pupils */}
        <circle cx="167" cy="87" r="6" fill="#1a1a1a" className="pupil-left" />
        <circle cx="237" cy="87" r="6" fill="#1a1a1a" className="pupil-right" />
        
        {/* Happy Mouth */}
        <path d="M 165 110 Q 200 125 235 110" stroke="#1a1a1a" strokeWidth="3" fill="none" />
      </g>

      {/* Left Robot Arm */}
      <g className="robot-arm left-arm">
        <rect x="80" y="140" width="60" height="20" rx="10" fill="#4A90E2" filter="url(#glow)" />
        <circle cx="80" cy="150" r="12" fill="#357ABD" />
        {/* Gripper */}
        <path d="M 75 145 Q 70 140 70 135" stroke="#357ABD" strokeWidth="4" fill="none" />
        <path d="M 75 155 Q 70 160 70 165" stroke="#357ABD" strokeWidth="4" fill="none" />
      </g>

      {/* Body */}
      <g className="robot-body">
        <rect x="130" y="150" width="140" height="80" rx="8" fill="#3D5A6C" filter="url(#glow)" />
        
        {/* Torso Details - LED lights */}
        <circle cx="160" cy="170" r="8" fill="#00D9FF" opacity="0.6" className="led-light" />
        <circle cx="200" cy="170" r="8" fill="#00D9FF" opacity="0.6" className="led-light" />
        <circle cx="240" cy="170" r="8" fill="#00D9FF" opacity="0.6" className="led-light" />
        
        {/* LED Strip */}
        <rect x="140" y="195" width="120" height="4" rx="2" fill="#00D9FF" opacity="0.8" className="led-strip" />
      </g>

      {/* Right Robot Arm */}
      <g className="robot-arm right-arm">
        <rect x="260" y="140" width="60" height="20" rx="10" fill="#4A90E2" filter="url(#glow)" />
        <circle cx="320" cy="150" r="12" fill="#357ABD" />
        {/* Gripper */}
        <path d="M 325 145 Q 330 140 330 135" stroke="#357ABD" strokeWidth="4" fill="none" />
        <path d="M 325 155 Q 330 160 330 165" stroke="#357ABD" strokeWidth="4" fill="none" />
      </g>

      {/* Left Wheel */}
      <g className="wheel left-wheel">
        <circle cx="145" cy="235" r="18" fill="#1a1a1a" />
        <circle cx="145" cy="235" r="14" fill="#444" />
        <circle cx="145" cy="235" r="6" fill="#FF6B35" />
      </g>

      {/* Right Wheel */}
      <g className="wheel right-wheel">
        <circle cx="255" cy="235" r="18" fill="#1a1a1a" />
        <circle cx="255" cy="235" r="14" fill="#444" />
        <circle cx="255" cy="235" r="6" fill="#FF6B35" />
      </g>

      {/* Motion lines for dynamic feel */}
      <g className="motion-lines" opacity="0.6">
        <path d="M 30 150 L 50 150" stroke="#00D9FF" strokeWidth="2" />
        <path d="M 35 170 L 55 170" stroke="#00D9FF" strokeWidth="2" />
        <path d="M 350 150 L 370 150" stroke="#00D9FF" strokeWidth="2" />
        <path d="M 345 170 L 365 170" stroke="#00D9FF" strokeWidth="2" />
      </g>
    </svg>
  );
}
