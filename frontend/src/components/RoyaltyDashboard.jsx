import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  PATENT_TOKEN_ADDRESS, 
  PATENT_TOKEN_ABI,
  ROYALTY_DISTRIBUTION_ADDRESS,
  ROYALTY_DISTRIBUTION_ABI
} from '../contracts';

const RoyaltyDashboard = ({ account, signer }) => {
  const [myPatents, setMyPatents] = useState([]);
  const [revenueShares, setRevenueShares] = useState({});
  const [totalReceived, setTotalReceived] = useState('0');
  const [distributionForm, setDistributionForm] = useState({
    patentTokenId: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    if (account && signer) {
      loadMyPatents();
      loadTotalReceived();
    }
  }, [account, signer]);

  const loadMyPatents = async () => {
    try {
      const patentToken = new ethers.Contract(PATENT_TOKEN_ADDRESS, PATENT_TOKEN_ABI, signer);
      const balance = await patentToken.balanceOf(account);
      
      const patents = [];
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await patentToken.tokenOfOwnerByIndex(account, i);
          const patentInfo = await patentToken.getPatentInfo(tokenId);
          const shares = await loadRevenueShares(tokenId);
          
          patents.push({
            tokenId: tokenId.toString(),
            ...patentInfo,
            shares: shares
          });
        } catch (error) {
          console.error(`Error loading patent ${i}:`, error);
        }
      }
      setMyPatents(patents);
    } catch (error) {
      console.error('Error loading patents:', error);
    }
  };

  const loadRevenueShares = async (tokenId) => {
    try {
      const royaltyDistribution = new ethers.Contract(ROYALTY_DISTRIBUTION_ADDRESS, ROYALTY_DISTRIBUTION_ABI, signer);
      const shares = await royaltyDistribution.getRevenueShares(tokenId);
      return shares;
    } catch (error) {
      console.error(`Error loading revenue shares for token ${tokenId}:`, error);
      return [];
    }
  };

  const loadTotalReceived = async () => {
    try {
      const royaltyDistribution = new ethers.Contract(ROYALTY_DISTRIBUTION_ADDRESS, ROYALTY_DISTRIBUTION_ABI, signer);
      const received = await royaltyDistribution.getTotalReceived(account);
      setTotalReceived(ethers.formatEther(received));
    } catch (error) {
      console.error('Error loading total received:', error);
    }
  };

  const handleDistributionFormChange = (e) => {
    setDistributionForm({
      ...distributionForm,
      [e.target.name]: e.target.value
    });
  };

  const distributeRevenue = async (e) => {
    e.preventDefault();
    if (!signer) {
      alert('Please connect wallet first');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const royaltyDistribution = new ethers.Contract(ROYALTY_DISTRIBUTION_ADDRESS, ROYALTY_DISTRIBUTION_ABI, signer);
      
      const amount = ethers.parseEther(distributionForm.amount);

      const tx = await royaltyDistribution.distributeRevenue(
        distributionForm.patentTokenId,
        { value: amount }
      );

      await tx.wait();
      setResult(`✅ Revenue distributed successfully! Amount: ${distributionForm.amount} ETH`);

      // 重置表单
      setDistributionForm({
        patentTokenId: '',
        amount: ''
      });

      // 重新加载数据
      loadTotalReceived();

    } catch (error) {
      console.error('Error distributing revenue:', error);
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setupRevenueShares = async (tokenId, recipients, percentages) => {
    if (!signer) {
      alert('Please connect wallet first');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const royaltyDistribution = new ethers.Contract(ROYALTY_DISTRIBUTION_ADDRESS, ROYALTY_DISTRIBUTION_ABI, signer);
      
      const tx = await royaltyDistribution.setRevenueShares(
        tokenId,
        recipients,
        percentages
      );

      await tx.wait();
      setResult(`✅ Revenue shares set successfully for Patent #${tokenId}`);

      // 重新加载数据
      loadMyPatents();

    } catch (error) {
      console.error('Error setting revenue shares:', error);
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="royalty-dashboard">
      <h2>Royalty Dashboard</h2>
      
      <div className="stats-overview">
        <div className="stat-card">
          <h3>Total Royalties Received</h3>
          <p className="stat-value">{totalReceived} ETH</p>
        </div>
        <div className="stat-card">
          <h3>Patents with Royalties</h3>
          <p className="stat-value">{myPatents.length}</p>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h3>Distribute Revenue</h3>
          <p>Distribute licensing revenue to patent stakeholders</p>

          <form onSubmit={distributeRevenue} className="distribution-form">
            <div className="form-row">
              <div className="form-group">
                <label>Select Patent *</label>
                <select
                  name="patentTokenId"
                  value={distributionForm.patentTokenId}
                  onChange={handleDistributionFormChange}
                  required
                >
                  <option value="">Choose a patent</option>
                  {myPatents.map(patent => (
                    <option key={patent.tokenId} value={patent.tokenId}>
                      {patent.patentNumber} - {patent.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount (ETH) *</label>
                <input
                  type="number"
                  name="amount"
                  value={distributionForm.amount}
                  onChange={handleDistributionFormChange}
                  step="0.001"
                  min="0.001"
                  placeholder="0.1"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || myPatents.length === 0}
            >
              {loading ? 'Distributing...' : 'Distribute Revenue'}
            </button>
          </form>
        </div>

        <div className="section">
          <h3>My Patent Royalties</h3>
          <p>Royalty structure for your patents</p>

          {myPatents.length === 0 ? (
            <div className="empty-state">
              <p>You don't own any patents with royalty settings.</p>
            </div>
          ) : (
            <div className="patents-royalties">
              {myPatents.map(patent => (
                <div key={patent.tokenId} className="royalty-card">
                  <div className="royalty-header">
                    <h4>{patent.title}</h4>
                    <span className="royalty-percentage">
                      {patent.royaltyPercentage / 100}% Royalty
                    </span>
                  </div>
                  
                  <div className="patent-info">
                    <span className="patent-number">{patent.patentNumber}</span>
                    <span className="token-id">Token #{patent.tokenId}</span>
                  </div>

                  <div className="revenue-shares">
                    <h5>Revenue Distribution</h5>
                    {patent.shares && patent.shares.length > 0 ? (
                      <div className="shares-list">
                        {patent.shares.map((share, index) => (
                          <div key={index} className="share-item">
                            <span className="recipient">{formatAddress(share.recipient)}</span>
                            <span className="percentage">{share.sharePercentage / 100}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-shares">No revenue shares configured</p>
                    )}
                  </div>

                  <button 
                    className="setup-shares-btn"
                    onClick={() => setupRevenueShares(
                      patent.tokenId,
                      [account], // 默认只给自己
                      [10000]    // 100%
                    )}
                    disabled={loading}
                  >
                    Setup Revenue Shares
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="result">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default RoyaltyDashboard;