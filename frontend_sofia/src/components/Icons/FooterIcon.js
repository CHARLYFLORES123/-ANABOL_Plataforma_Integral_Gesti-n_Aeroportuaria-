import React from 'react';

const FooterIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="footer" mask-type="alpha" maskUnits="userSpaceOnUse" x="1" y="2" width="14" height="12">
      </mask>
      <g mask="url(#footer)">
        <rect width="16" height="16" fill="#FF5668"/>
      </g>
    </svg>
  );
}

export default FooterIcon;
