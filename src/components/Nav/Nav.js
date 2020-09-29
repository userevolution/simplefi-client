import React from 'react';
import WalletConnect from '../WalletConnect/WalletConnect';
import './Nav.css';

export default function Nav ({connect}) {
  return (
    <nav>
      <div class="nav-title">SimpleFi</div>
      <div class="nav-buttons">
        <button onClick={connect}>Connect wallet</button>
      </div>
    </nav>
  )
}
