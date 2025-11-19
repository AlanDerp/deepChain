import React from 'react';

const Header = ({ account, isConnected, connectWallet, disconnectWallet }) => {
  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <h1>PatentChain</h1>
          <p>Blockchain Patent Management</p>
        </div>
        {isConnected && (
          <div className="wallet-info">
            <span className="address">{formatAddress(account)}</span>
            <button onClick={disconnectWallet} className="disconnect-btn">
              Disconnect
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;