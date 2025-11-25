import React, { useState } from 'react';
import { ethers } from 'ethers';
import { 
  PATENT_TOKEN_ADDRESS, 
  PATENT_TOKEN_ABI,
  PATENT_REGISTRY_ADDRESS,
  PATENT_REGISTRY_ABI
} from '../contracts';

const PatentMinter = ({ signer }) => {
  const [formData, setFormData] = useState({
    patentNumber: '',
    title: '',
    inventor: '',
    description: '',
    filingDate: '',
    grantDate: '',
    royaltyPercentage: '5',
    tokenURI: 'ipfs://'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const mintPatent = async (e) => {
    e.preventDefault();
    if (!signer) {
      alert('Please connect wallet first');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      // ... 原有的铸造逻辑保持不变
    } catch (error) {
      console.error('Error minting patent:', error);
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patent-minter">
      {/* 居中的标题部分 */}
      <div className="minter-header">
        <h2>Create New Patent</h2>
        <p className="description">
          Transform your invention into a unique digital asset on the blockchain
        </p>
      </div>

      {/* 居中的表单容器 */}
      <div className="form-container">
        <form onSubmit={mintPatent} className="patent-form">
          <div className="form-row">
            <div className="form-group">
              <label>Patent Number *</label>
              <input
                type="text"
                name="patentNumber"
                value={formData.patentNumber}
                onChange={handleChange}
                placeholder="e.g., US-2023-001"
                required
              />
            </div>

            <div className="form-group">
              <label>Royalty Percentage *</label>
              <input
                type="number"
                name="royaltyPercentage"
                value={formData.royaltyPercentage}
                onChange={handleChange}
                min="1"
                max="20"
                step="0.5"
                required
              />
              <small>Percentage of sales price (1-20%)</small>
            </div>
          </div>

          <div className="form-group">
            <label>Patent Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Blockchain-based Patent Management System"
              required
            />
          </div>

          <div className="form-group">
            <label>Inventor Name *</label>
            <input
              type="text"
              name="inventor"
              value={formData.inventor}
              onChange={handleChange}
              placeholder="e.g., Alice Inventor"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Filing Date *</label>
              <input
                type="date"
                name="filingDate"
                value={formData.filingDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Grant Date *</label>
              <input
                type="date"
                name="grantDate"
                value={formData.grantDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Patent Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the patent innovation..."
              required
            />
          </div>

          <div className="form-group">
            <label>Token URI</label>
            <input
              type="text"
              name="tokenURI"
              value={formData.tokenURI}
              onChange={handleChange}
              placeholder="ipfs:// or https:// metadata URI"
            />
            <small>Location of patent metadata (optional)</small>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-text">
                <span className="loading-dots">⦁⦁⦁</span> Minting Patent
              </span>
            ) : (
              '🚀 Mint Patent NFT'
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="result">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default PatentMinter;