import React, { useState } from 'react';
import { useWeb3 } from './hooks/useWeb3';
import Header from './components/Header';
import PatentMinter from './components/PatentMinter';
import PatentList from './components/PatentList';
import LicenseMarket from './components/LicenseMarket';
import RoyaltyDashboard from './components/RoyaltyDashboard';
import './App.css';

function App() {
  const { account, provider, signer, isConnected, connectWallet, disconnectWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState('mint');

  return (
    <div className="App">
      <Header 
        account={account}
        isConnected={isConnected}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />

      <main className="main">
        {!isConnected ? (
          <div className="connect-prompt">
            <h2>Welcome to PatentChain</h2>
            <p>Please connect your wallet to get started</p>
            <button onClick={connectWallet} className="primary-btn">
              Connect MetaMask
            </button>
          </div>
        ) : (
          <>
            <nav className="tabs">
              <button 
                className={activeTab === 'mint' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('mint')}
              >
                Mint Patent
              </button>
              <button 
                className={activeTab === 'patents' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('patents')}
              >
                My Patents
              </button>
              <button 
                className={activeTab === 'license' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('license')}
              >
                License Market
              </button>
              <button 
                className={activeTab === 'royalty' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('royalty')}
              >
                Royalties
              </button>
            </nav>

            <div className="tab-content">
              {activeTab === 'mint' && <PatentMinter signer={signer} />}
              {activeTab === 'patents' && <PatentList account={account} signer={signer} />}
              {activeTab === 'license' && <LicenseMarket signer={signer} />}
              {activeTab === 'royalty' && <RoyaltyDashboard account={account} signer={signer} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;