import React from 'react';
import logo from '../../assets/logo.png';

const SofiaLogo = (props) => {
  return (
   <img
      src={logo}
      alt="Logo"
      className={props.className}
      width="40"
      height="40"
    />
  );
}

export default SofiaLogo;
