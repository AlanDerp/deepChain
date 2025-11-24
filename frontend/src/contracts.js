// 合约地址 - 使用我们部署的地址
export const PATENT_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const PATENT_REGISTRY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
export const LICENSE_MANAGER_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
export const ROYALTY_DISTRIBUTION_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

// 完整ABI定义
export const PATENT_TOKEN_ABI = [
  // ERC721 标准函数
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external",
  
  // ERC721Enumerable 扩展
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  
  // ERC721URIStorage 扩展
  "function tokenURI(uint256 tokenId) view returns (string)",
  
  // EIP-2981 版税标准
  "function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)",
  
  // 自定义专利相关函数
  "function mintPatent(address to, uint256 tokenId, string uri, string patentNumber, string title, string inventor, uint64 filingDate, uint64 grantDate, uint256 royaltyPercentage) external",
  "function getPatentInfo(uint256 tokenId) view returns (string patentNumber, string title, string inventor, uint64 filingDate, uint64 grantDate, uint256 royaltyPercentage)",
  "function setRevenueShares(uint256 tokenId, address[] revenueShares, uint256[] sharePercentages) external",
  "function getRevenueShares(uint256 tokenId) view returns (address[] recipients, uint256[] percentages)",
  
  // 事件
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event RoyaltyInfoSet(uint256 indexed tokenId, uint256 royaltyPercentage)",
  "event RevenueSharesSet(uint256 indexed tokenId, address[] recipients, uint256[] percentages)"
];

export const PATENT_REGISTRY_ABI = [
  // 专利注册相关函数
  "function registerPatent(bytes32 patentHash, string patentNumber, string title, string description, uint64 filingDate, uint256 tokenId) external returns (uint256)",
  "function updatePatentStatus(uint256 recordId, uint8 status, uint64 grantDate, uint64 expirationDate) external",
  
  // 查询函数
  "function getPatentRecord(uint256 recordId) view returns (address owner, bytes32 patentHash, string patentNumber, string title, uint8 status, uint64 filingDate, uint64 grantDate, uint256 tokenId)",
  "function getRecordIdByHash(bytes32 patentHash) view returns (uint256)",
  "function getTotalPatents() view returns (uint256)",
  
  // 验证函数
  "function verifyPatent(uint256 recordId, bytes32 providedHash) view returns (bool)",
  "function isPatentActive(uint256 recordId) view returns (bool)",
  
  // 管理员函数
  "function owner() view returns (address)",
  
  // 事件
  "event PatentRegistered(uint256 indexed recordId, address indexed owner, bytes32 patentHash, string patentNumber, uint256 tokenId)",
  "event PatentStatusUpdated(uint256 indexed recordId, uint8 newStatus)",
  "event PatentVerified(uint256 indexed recordId, bytes32 patentHash, bool isValid)"
];

export const LICENSE_MANAGER_ABI = [
  // 许可证创建和购买
  "function createLicense(uint256 patentTokenId, address licensee, uint8 licenseType, string fieldOfUse, uint256 licenseFee, uint64 duration) external returns (uint256)",
  "function purchaseLicense(uint256 licenseId) external payable",
  
  // 许可证状态管理
  "function updateLicenseStatus(uint256 licenseId, uint8 newStatus) external",
  "function isLicenseValid(uint256 licenseId) view returns (bool)",
  
  // 查询函数
  "function getLicenseAgreement(uint256 licenseId) view returns (uint256 patentTokenId, address licensor, address licensee, uint8 licenseType, string fieldOfUse, uint256 licenseFee, uint64 startDate, uint64 duration, uint8 status, bool isPaid)",
  "function getLicensesForPatent(uint256 patentTokenId) view returns (uint256[])",
  "function getLicensesForLicensee(address licensee) view returns (uint256[])",
  "function hasValidLicense(uint256 patentTokenId, address licensee) view returns (bool)",
  
  // 管理员函数
  "function owner() view returns (address)",
  
  // 事件
  "event LicenseCreated(uint256 indexed licenseId, uint256 indexed patentTokenId, address indexed licensor, address licensee, uint8 licenseType, uint256 licenseFee)",
  "event LicensePurchased(uint256 indexed licenseId, address indexed licensee, uint256 feePaid)",
  "event LicenseStatusChanged(uint256 indexed licenseId, uint8 newStatus)"
];

export const ROYALTY_DISTRIBUTION_ABI = [
  // 收益分配设置
  "function setRevenueShares(uint256 patentTokenId, address[] recipients, uint256[] percentages) external",
  
  // 收益分配执行
  "function distributeRevenue(uint256 patentTokenId) external payable",
  
  // 查询函数
  "function getRevenueShares(uint256 patentTokenId) view returns (tuple(address recipient, uint256 sharePercentage)[] shares)",
  "function getTotalReceived(address recipient) view returns (uint256)",
  "function getDistributionHistory(uint256 patentTokenId) view returns (uint256[])",
  "function getDistributionDetails(uint256 distributionId) view returns (uint256 patentTokenId, uint256 totalAmount, uint256 distributionTimestamp, address distributedBy)",
  "function calculateDistribution(uint256 patentTokenId, uint256 totalAmount) view returns (address[] recipients, uint256[] amounts)",
  
  // 事件
  "event RevenueDistributed(uint256 indexed distributionId, uint256 indexed patentTokenId, uint256 totalAmount, uint256 distributionTimestamp)",
  "event RecipientPaid(uint256 indexed distributionId, address indexed recipient, uint256 amount)",
  "event RevenueSharesUpdated(uint256 indexed patentTokenId, address[] recipients, uint256[] percentages)"
];
