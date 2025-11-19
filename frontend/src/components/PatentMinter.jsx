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
    royaltyPercentage: '5', // 默认5%
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
      // 创建合约实例
      const patentToken = new ethers.Contract(PATENT_TOKEN_ADDRESS, PATENT_TOKEN_ABI, signer);
      const patentRegistry = new ethers.Contract(PATENT_REGISTRY_ADDRESS, PATENT_REGISTRY_ABI, signer);

      // 生成唯一的tokenId（使用时间戳）
      const tokenId = Math.floor(Date.now() / 1000);
      
      // 转换日期为时间戳
      const filingTimestamp = Math.floor(new Date(formData.filingDate).getTime() / 1000);
      const grantTimestamp = Math.floor(new Date(formData.grantDate).getTime() / 1000);
      
      // 计算版税百分比（基础点）
      const royaltyBasisPoints = parseInt(formData.royaltyPercentage) * 100;

      // 1. 铸造专利NFT
      const mintTx = await patentToken.mintPatent(
        await signer.getAddress(),
        tokenId,
        formData.tokenURI,
        formData.patentNumber,
        formData.title,
        formData.inventor,
        filingTimestamp,
        grantTimestamp,
        royaltyBasisPoints
      );
      
      await mintTx.wait();
      setResult(`✅ Patent NFT minted successfully! Token ID: ${tokenId}`);

      // 2. 在注册表中注册专利
      const patentHash = ethers.keccak256(ethers.toUtf8Bytes(formData.description));
      const registerTx = await patentRegistry.registerPatent(
        patentHash,
        formData.patentNumber,
        formData.title,
        formData.description,
        filingTimestamp,
        tokenId
      );
      
      await registerTx.wait();
      setResult(prev => prev + `\n✅ Patent registered in registry!`);

      // 3. 更新专利状态为已授权
      const updateTx = await patentRegistry.updatePatentStatus(
        1, // 假设这是第一个记录
        1, // GRANTED
        grantTimestamp,
        grantTimestamp + 86400 * 365 * 20 // 20年有效期
      );
      
      await updateTx.wait();
      setResult(prev => prev + `\n✅ Patent status updated to GRANTED!`);

      // 重置表单
      setFormData({
        patentNumber: '',
        title: '',
        inventor: '',
        description: '',
        filingDate: '',
        grantDate: '',
        royaltyPercentage: '5',
        tokenURI: 'ipfs://'
      });

    } catch (error) {
      console.error('Error minting patent:', error);
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patent-minter">
      <h2>Mint New Patent</h2>
      <p className="description">
        Convert your patent into a unique NFT on the blockchain
      </p>

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
            placeholder="Detailed description of the patent..."
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
          {loading ? 'Minting...' : 'Mint Patent NFT'}
        </button>
      </form>

      {result && (
        <div className="result">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default PatentMinter;