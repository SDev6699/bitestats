import React, { useState } from 'react';
import './ToggleSwitch.css';

const ToggleSwitch = ({ checked, onChange, labelOn, labelOff }) => {
  const [val, setVal] = useState(checked);

  const handleToggle = () => {
    const newVal = !val;
    setVal(newVal);
    onChange(newVal);
  };

  return (
    <div className="toggle-switch" onClick={handleToggle}>
      <div className={`toggle-option ${val ? 'selected' : ''}`}>
        {labelOn}
      </div>
      <div className={`toggle-option ${!val ? 'selected' : ''}`}>
        {labelOff}
      </div>
    </div>
  );
};

export default ToggleSwitch;
