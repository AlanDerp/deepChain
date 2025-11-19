// 合约地址 - 使用我们部署的地址
export const PATENT_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const PATENT_REGISTRY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const LICENSE_MANAGER_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
export const ROYALTY_DISTRIBUTION_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

// 基础ABI（简化版本，用于前端）
export const PATENT_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function mintPatent(address to, uint256 tokenId, string uri, string patentNumber, string title, string inventor, uint64 filingDate, uint64 grantDate, uint256 royaltyPercentage) external",
  "function getPatentInfo(uint256 tokenId) view returns (string patentNumber, string title, string inventor, uint64 filingDate, uint64 grantDate, uint256 royaltyPercentage)",
  "function setRevenueShares(uint256 tokenId, address[] revenueShares, uint256[] sharePercentages) external",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

export const PATENT_REGISTRY_ABI = [
  "function registerPatent(bytes32 patentHash, string patentNumber, string title, string description, uint64 filingDate, uint256 tokenId) external returns (uint256)",
  "function getPatentRecord(uint256 recordId) view returns (address owner, bytes32 patentHash, string patentNumber, string title, uint8 status, uint64 filingDate, uint64 grantDate, uint256 tokenId)",
  "function verifyPatent(uint256 recordId, bytes32 providedHash) view returns (bool)",
  "function getTotalPatents() view returns (uint256)",
  "event PatentRegistered(uint256 indexed recordId, address indexed owner, bytes32 patentHash, string patentNumber, uint256 tokenId)"
];

export const LICENSE_MANAGER_ABI = [
  "function createLicense(uint256 patentTokenId, address licensee, uint8 licenseType, string fieldOfUse, uint256 licenseFee, uint64 duration) external returns (uint256)",
  "function purchaseLicense(uint256 licenseId) external payable",
  "function getLicenseAgreement(uint256 licenseId) view returns (uint256 patentTokenId, address licensor, address licensee, uint8 licenseType, string fieldOfUse, uint256 licenseFee, uint64 startDate, uint64 duration, uint8 status, bool isPaid)",
  "function isLicenseValid(uint256 licenseId) view returns (bool)",
  "function getLicensesForPatent(uint256 patentTokenId) view returns (uint256[])",
  "event LicenseCreated(uint256 indexed licenseId, uint256 indexed patentTokenId, address indexed licensor, address licensee, uint8 licenseType, uint256 licenseFee)"
];

export const ROYALTY_DISTRIBUTION_ABI = [
  "function setRevenueShares(uint256 patentTokenId, address[] recipients, uint256[] percentages) external",
  "function distributeRevenue(uint256 patentTokenId) external payable",
  "function getRevenueShares(uint256 patentTokenId) view returns (tuple(address recipient, uint256 sharePercentage)[])",
  "function getTotalReceived(address recipient) view returns (uint256)",
  "event RevenueDistributed(uint256 indexed distributionId, uint256 indexed patentTokenId, uint256 totalAmount, uint256 distributionTimestamp)"
];