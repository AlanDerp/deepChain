import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  PATENT_TOKEN_ADDRESS, 
  PATENT_TOKEN_ABI,
  PATENT_REGISTRY_ADDRESS,
  PATENT_REGISTRY_ABI
} from '../contracts';

const PatentList = ({ account, signer }) => {
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account && signer) {
      loadPatents();
    }
  }, [account, signer]);

  const loadPatents = async () => {
    try {
      const patentToken = new ethers.Contract(PATENT_TOKEN_ADDRESS, PATENT_TOKEN_ABI, signer);
      const patentRegistry = new ethers.Contract(PATENT_REGISTRY_ADDRESS, PATENT_REGISTRY_ABI, signer);

      // 获取用户拥有的专利NFT数量
      const balanceBn = await patentToken.balanceOf(account);
      const balance = Number(balanceBn);

      if (balance === 0) {
        setPatents([]);
        return;
      }
      
      const userPatents = [];
      
      // 遍历所有tokenId
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await patentToken.tokenOfOwnerByIndex(account, i);
          const [
            patentNumber,
            title,
            inventor,
            filingDate,
            grantDate,
            royaltyPercentage
          ] = await patentToken.getPatentInfo(tokenId);
          
          userPatents.push({
            tokenId: tokenId.toString(),
            patentNumber,
            title,
            inventor,
            filingDate: Number(filingDate),
            grantDate: Number(grantDate),
            royaltyPercentage: Number(royaltyPercentage)
          });
        } catch (error) {
          console.error(`Error loading patent ${i}:`, error);
        }
      }
      
      setPatents(userPatents);
    } catch (error) {
      console.error('Error loading patents:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="patent-list">
        <h2>My Patents</h2>
        <p>Loading your patents...</p>
      </div>
    );
  }

  return (
    <div className="patent-list">
      <h2>My Patents</h2>
      <p>Patents you own as NFTs</p>

      {patents.length === 0 ? (
        <div className="empty-state">
          <p>You don't own any patents yet.</p>
          <p>Mint your first patent using the "Mint Patent" tab!</p>
        </div>
      ) : (
        <div className="patents-grid">
          {patents.map((patent, index) => (
            <div key={index} className="patent-card">
              <div className="patent-header">
                <h3>{patent.title}</h3>
                <span className="token-id">Token #{patent.tokenId}</span>
              </div>
              
              <div className="patent-details">
                <div className="detail">
                  <label>Patent Number:</label>
                  <span>{patent.patentNumber}</span>
                </div>
                
                <div className="detail">
                  <label>Inventor:</label>
                  <span>{patent.inventor}</span>
                </div>
                
                <div className="detail">
                  <label>Filing Date:</label>
                  <span>{formatDate(patent.filingDate)}</span>
                </div>
                
                <div className="detail">
                  <label>Grant Date:</label>
                  <span>{formatDate(patent.grantDate)}</span>
                </div>
                
                <div className="detail">
                  <label>Royalty:</label>
                  <span className="royalty">{patent.royaltyPercentage / 100}%</span>
                </div>
              </div>
              
              <div className="patent-actions">
                <button className="action-btn primary">View Details</button>
                <button className="action-btn secondary">Create License</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatentList;
