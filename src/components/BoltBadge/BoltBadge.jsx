import React from 'react';
import boltLogo from '../../assets/icons/boltlogo.png';
import './BoltBadge.scss';

const BoltBadge = () => (
  <a
    href="https://bolt.new/"
    target="_blank"
    rel="noopener noreferrer"
    className="bolt-badge"
    aria-label="Bolt New"
  >
    <img src={boltLogo} alt="Bolt New" />
  </a>
);

export default BoltBadge;
