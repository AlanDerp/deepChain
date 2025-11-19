import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  PATENT_TOKEN_ADDRESS, 
  PATENT_TOKEN_ABI,
  LICENSE_MANAGER_ADDRESS,
  LICENSE_MANAGER_ABI
} from '../contracts';

const LicenseMarket = ({ signer }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [myPatents, setMyPatents] = useState([]);
  const [availableLicenses, setAvailableLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // 创建许可证表单状态
  const [licenseForm, setLicenseForm] = useState({
    patentTokenId: '',
    licensee: '',
    licenseType: '1', // NON_EXCLUSIVE
    fieldOfUse: '',
    licenseFee: '',
    duration: '365' // 1 year in days
  });

  useEffect(() => {
    if (signer) {
      loadMyPatents();
      loadAvailableLicenses();
    }
  }, [signer]);

  const loadMyPatents = async () => {
    try {
      const patentToken = new ethers.Contract(PATENT_TOKEN_ADDRESS, PATENT_TOKEN_ABI, signer);
      const address = await signer.getAddress();
      const balance = await patentToken.balanceOf(address);
      
      const patents = [];
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await patentToken.tokenOfOwnerByIndex(address, i);
          const patentInfo = await patentToken.getPatentInfo(tokenId);
          patents.push({
            tokenId: tokenId.toString(),
            ...patentInfo
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

  const loadAvailableLicenses = async () => {
    // 这里简化实现，实际应该从合约事件或列表中获取
    setAvailableLicenses([
      {
        licenseId: 1,
        patentTokenId: 1,
        title: "Blockchain-based Patent Management System",
        licensor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        licenseType: 1,
        fieldOfUse: "Software Development",
        licenseFee: ethers.parseEther("1.0"),
        duration: 31536000 // 1 year in seconds
      }
    ]);
  };

  const handleLicenseFormChange = (e) => {
    setLicenseForm({
      ...licenseForm,
      [e.target.name]: e.target.value
    });
  };

  const createLicense = async (e) => {
    e.preventDefault();
    if (!signer) {
      alert('Please connect wallet first');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const licenseManager = new ethers.Contract(LICENSE_MANAGER_ADDRESS, LICENSE_MANAGER_ABI, signer);
      
      const licenseFee = ethers.parseEther(licenseForm.licenseFee);
      const duration = parseInt(licenseForm.duration) * 86400; // Convert days to seconds

      const tx = await licenseManager.createLicense(
        licenseForm.patentTokenId,
        licenseForm.licensee,
        parseInt(licenseForm.licenseType),
        licenseForm.fieldOfUse,
        licenseFee,
        duration
      );

      await tx.wait();
      setResult(`✅ License created successfully! License ID: pending...`);

      // 重置表单
      setLicenseForm({
        patentTokenId: '',
        licensee: '',
        licenseType: '1',
        fieldOfUse: '',
        licenseFee: '',
        duration: '365'
      });

    } catch (error) {
      console.error('Error creating license:', error);
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const purchaseLicense = async (licenseId, licenseFee) => {
    if (!signer) {
      alert('Please connect wallet first');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const licenseManager = new ethers.Contract(LICENSE_MANAGER_ADDRESS, LICENSE_MANAGER_ABI, signer);
      
      const tx = await licenseManager.purchaseLicense(licenseId, {
        value: licenseFee
      });

      await tx.wait();
      setResult(`✅ License purchased successfully! License ID: ${licenseId}`);

    } catch (error) {
      console.error('Error purchasing license:', error);
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatLicenseType = (type) => {
    const types = {
      0: 'Exclusive',
      1: 'Non-Exclusive',
      2: 'Field-Specific'
    };
    return types[type] || 'Unknown';
  };

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="license-market">
      <h2>License Marketplace</h2>
      
      <div className="market-tabs">
        <button 
          className={activeTab === 'create' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('create')}
        >
          Create License
        </button>
        <button 
          className={activeTab === 'browse' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('browse')}
        >
          Browse Licenses
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'create' && (
          <div className="create-license">
            <h3>Create New License Agreement</h3>
            <p>License out your patents to other users</p>

            <form onSubmit={createLicense} className="license-form">
              <div className="form-group">
                <label>Select Patent *</label>
                <select
                  name="patentTokenId"
                  value={licenseForm.patentTokenId}
                  onChange={handleLicenseFormChange}
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
                <label>Licensee Address *</label>
                <input
                  type="text"
                  name="licensee"
                  value={licenseForm.licensee}
                  onChange={handleLicenseFormChange}
                  placeholder="0x..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>License Type *</label>
                  <select
                    name="licenseType"
                    value={licenseForm.licenseType}
                    onChange={handleLicenseFormChange}
                    required
                  >
                    <option value="1">Non-Exclusive</option>
                    <option value="0">Exclusive</option>
                    <option value="2">Field-Specific</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration (Days) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={licenseForm.duration}
                    onChange={handleLicenseFormChange}
                    min="30"
                    max="3650"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Field of Use</label>
                <input
                  type="text"
                  name="fieldOfUse"
                  value={licenseForm.fieldOfUse}
                  onChange={handleLicenseFormChange}
                  placeholder="e.g., Software Development, Manufacturing"
                />
              </div>

              <div className="form-group">
                <label>License Fee (ETH) *</label>
                <input
                  type="number"
                  name="licenseFee"
                  value={licenseForm.licenseFee}
                  onChange={handleLicenseFormChange}
                  step="0.001"
                  min="0.001"
                  placeholder="0.1"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading || myPatents.length === 0}
              >
                {loading ? 'Creating...' : 'Create License Agreement'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="browse-licenses">
            <h3>Available Licenses</h3>
            <p>Purchase licenses for patented technologies</p>

            {availableLicenses.length === 0 ? (
              <div className="empty-state">
                <p>No licenses available for purchase at the moment.</p>
              </div>
            ) : (
              <div className="licenses-grid">
                {availableLicenses.map(license => (
                  <div key={license.licenseId} className="license-card">
                    <div className="license-header">
                      <h4>{license.title}</h4>
                      <span className="license-type">
                        {formatLicenseType(license.licenseType)}
                      </span>
                    </div>
                    
                    <div className="license-details">
                      <div className="detail">
                        <label>Patent ID:</label>
                        <span>#{license.patentTokenId}</span>
                      </div>
                      
                      <div className="detail">
                        <label>Licensor:</label>
                        <span>{formatAddress(license.licensor)}</span>
                      </div>
                      
                      <div className="detail">
                        <label>Field of Use:</label>
                        <span>{license.fieldOfUse}</span>
                      </div>
                      
                      <div className="detail">
                        <label>Fee:</label>
                        <span className="fee">{ethers.formatEther(license.licenseFee)} ETH</span>
                      </div>
                      
                      <div className="detail">
                        <label>Duration:</label>
                        <span>{license.duration / 86400} days</span>
                      </div>
                    </div>
                    
                    <button 
                      className="purchase-btn"
                      onClick={() => purchaseLicense(license.licenseId, license.licenseFee)}
                      disabled={loading}
                    >
                      {loading ? 'Purchasing...' : 'Purchase License'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {result && (
        <div className="result">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default LicenseMarket;