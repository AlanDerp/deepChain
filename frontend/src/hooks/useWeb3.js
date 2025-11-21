import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export const useWeb3 = () => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const resetConnectionState = useCallback(() => {
    setAccount('');
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
  }, []);

  const handleAccountsChanged = useCallback(
    (accounts) => {
      if (!accounts || accounts.length === 0) {
        resetConnectionState();
      } else {
        setAccount(accounts[0]);
      }
    },
    [resetConnectionState]
  );

  const handleDisconnectEvent = useCallback(() => {
    resetConnectionState();
  }, [resetConnectionState]);

  const disconnectWallet = useCallback(async () => {
    if (window.ethereum?.removeListener) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('disconnect', handleDisconnectEvent);
    }

    // 尝试撤销 dapp 对账户的访问权限
    try {
      await window.ethereum?.request?.({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }]
      });
    } catch (err) {
      console.warn('Failed to revoke wallet permissions:', err);
    } finally {
      resetConnectionState();
    }
  }, [handleAccountsChanged, handleDisconnectEvent, resetConnectionState]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        return;
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const userAddress = accounts[0];

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAddress);
      setIsConnected(true);

      // 确保不重复注册监听器
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnectEvent);
      }
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('disconnect', handleDisconnectEvent);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }, [handleAccountsChanged, handleDisconnectEvent]);

  useEffect(() => {
    // 检查是否已经连接了钱包
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const web3Signer = await web3Provider.getSigner();

          setProvider(web3Provider);
          setSigner(web3Signer);
          setAccount(accounts[0]);
          setIsConnected(true);

          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('disconnect', handleDisconnectEvent);
        }
      }
    };

    checkConnection();
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnectEvent);
      }
    };
  }, [handleAccountsChanged, handleDisconnectEvent]);

  return {
    account,
    provider,
    signer,
    isConnected,
    connectWallet,
    disconnectWallet
  };
};
