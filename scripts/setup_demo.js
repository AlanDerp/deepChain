const { ethers } = require("hardhat");

// Contract addresses from deployment (update these after deployment)
const CONTRACT_ADDRESSES = {
  PatentToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  PatentRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  LicenseManager: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  RoyaltyDistribution: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
};

async function main() {
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  
  console.log("Setting up PatentChain demo data...");
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  console.log("User3:", user3.address);

  // Get contract instances
  const patentToken = await ethers.getContractAt("PatentToken", CONTRACT_ADDRESSES.PatentToken);
  const patentRegistry = await ethers.getContractAt("PatentRegistry", CONTRACT_ADDRESSES.PatentRegistry);
  const licenseManager = await ethers.getContractAt("LicenseManager", CONTRACT_ADDRESSES.LicenseManager);
  const royaltyDistribution = await ethers.getContractAt("RoyaltyDistribution", CONTRACT_ADDRESSES.RoyaltyDistribution);

  console.log("\n=== Setting up Demo Patents ===");

  // Patent 1: Blockchain Patent
  console.log("\n1. Creating Blockchain Patent...");
  const tokenId1 = 1;
  const patentHash1 = ethers.keccak256(ethers.toUtf8Bytes("Blockchain Patent Specification Document v1.0"));
  
  await patentToken.mintPatent(
    deployer.address,
    tokenId1,
    "ipfs://QmBlockchainPatentMetadata",
    "US-2023-BLOCK001",
    "Decentralized Patent Management System",
    "Alice Blockchain",
    Math.floor(Date.now() / 1000) - 86400 * 60,
    Math.floor(Date.now() / 1000) - 86400 * 30,
    750, // 7.5% royalty
    [deployer.address, user1.address],
    [7000, 3000]
  );

  await patentRegistry.registerPatent(
    patentHash1,
    "US-2023-BLOCK001",
    "Decentralized Patent Management System",
    "A system for managing intellectual property using decentralized blockchain technology",
    Math.floor(Date.now() / 1000) - 86400 * 60,
    tokenId1
  );

  await patentRegistry.updatePatentStatus(
    1,
    1, // GRANTED
    Math.floor(Date.now() / 1000) - 86400 * 30,
    Math.floor(Date.now() / 1000) + 86400 * 365 * 15
  );

  await royaltyDistribution.setRevenueShares(
    tokenId1,
    [deployer.address, user1.address],
    [7000, 3000]
  );

  console.log("✓ Blockchain Patent created (Token ID: 1)");

  // Patent 2: AI Algorithm Patent
  console.log("\n2. Creating AI Algorithm Patent...");
  const tokenId2 = 2;
  const patentHash2 = ethers.keccak256(ethers.toUtf8Bytes("AI Algorithm Patent Technical Details v2.1"));
  
  await patentToken.mintPatent(
    user1.address,
    tokenId2,
    "ipfs://QmAIPatentMetadata",
    "US-2023-AI002",
    "Machine Learning Model Optimization Method",
    "Bob AI Researcher",
    Math.floor(Date.now() / 1000) - 86400 * 90,
    Math.floor(Date.now() / 1000) - 86400 * 15,
    1000, // 10% royalty
    [user1.address, user2.address],
    [6000, 4000]
  );

  await patentRegistry.registerPatent(
    patentHash2,
    "US-2023-AI002",
    "Machine Learning Model Optimization Method",
    "Novel method for optimizing neural network training efficiency",
    Math.floor(Date.now() / 1000) - 86400 * 90,
    tokenId2
  );

  await patentRegistry.updatePatentStatus(
    2,
    1, // GRANTED
    Math.floor(Date.now() / 1000) - 86400 * 15,
    Math.floor(Date.now() / 1000) + 86400 * 365 * 17
  );

  await royaltyDistribution.setRevenueShares(
    tokenId2,
    [user1.address, user2.address],
    [6000, 4000]
  );

  console.log("✓ AI Algorithm Patent created (Token ID: 2)");

  // Patent 3: Medical Device Patent
  console.log("\n3. Creating Medical Device Patent...");
  const tokenId3 = 3;
  const patentHash3 = ethers.keccak256(ethers.toUtf8Bytes("Medical Device Technical Specifications v3.0"));
  
  await patentToken.mintPatent(
    user2.address,
    tokenId3,
    "ipfs://QmMedicalPatentMetadata",
    "US-2023-MED003",
    "Smart Health Monitoring Device",
    "Carol Medical Engineer",
    Math.floor(Date.now() / 1000) - 86400 * 120,
    Math.floor(Date.now() / 1000) - 86400 * 7,
    300, // 3% royalty
    [user2.address, deployer.address],
    [9000, 1000]
  );

  await patentRegistry.registerPatent(
    patentHash3,
    "US-2023-MED003",
    "Smart Health Monitoring Device",
    "Wearable device for continuous health parameter monitoring",
    Math.floor(Date.now() / 1000) - 86400 * 120,
    tokenId3
  );

  await patentRegistry.updatePatentStatus(
    3,
    1, // GRANTED
    Math.floor(Date.now() / 1000) - 86400 * 7,
    Math.floor(Date.now() / 1000) + 86400 * 365 * 12
  );

  await royaltyDistribution.setRevenueShares(
    tokenId3,
    [user2.address, deployer.address],
    [9000, 1000]
  );

  console.log("✓ Medical Device Patent created (Token ID: 3)");

  console.log("\n=== Setting up License Agreements ===");

  // License for Patent 1
  console.log("\n1. Creating licenses for Blockchain Patent...");
  await licenseManager.createLicense(
    tokenId1,
    user2.address,
    1, // NON_EXCLUSIVE
    "Software Development",
    ethers.parseEther("2.5"),
    86400 * 365 // 1 year
  );

  await licenseManager.createLicense(
    tokenId1,
    user3.address,
    0, // EXCLUSIVE
    "Financial Services",
    ethers.parseEther("10.0"),
    86400 * 730 // 2 years
  );

  console.log("✓ 2 licenses created for Blockchain Patent");

  // License for Patent 2
  console.log("\n2. Creating licenses for AI Patent...");
  await licenseManager.createLicense(
    tokenId2,
    deployer.address,
    2, // FIELD_SPECIFIC
    "Healthcare AI",
    ethers.parseEther("5.0"),
    86400 * 545 // 1.5 years
  );

  console.log("✓ License created for AI Patent");

  // License for Patent 3
  console.log("\n3. Creating licenses for Medical Patent...");
  await licenseManager.createLicense(
    tokenId3,
    user1.address,
    1, // NON_EXCLUSIVE
    "Hospital Equipment",
    ethers.parseEther("3.0"),
    86400 * 1825 // 5 years
  );

  console.log("✓ License created for Medical Patent");

  console.log("\n=== Simulating Revenue Distribution ===");

  // Distribute some demo revenue
  console.log("\n1. Distributing revenue for Blockchain Patent...");
  await royaltyDistribution.distributeRevenue(tokenId1, {
    value: ethers.parseEther("1.5")
  });

  console.log("\n2. Distributing revenue for AI Patent...");
  await royaltyDistribution.distributeRevenue(tokenId2, {
    value: ethers.parseEther("0.8")
  });

  console.log("\n3. Distributing revenue for Medical Patent...");
  await royaltyDistribution.distributeRevenue(tokenId3, {
    value: ethers.parseEther("0.3")
  });

  console.log("\n🎉 Demo data setup completed!");
  console.log("\n=== Demo Summary ===");
  console.log("• 3 Patents created with different owners and royalty structures");
  console.log("• 4 License agreements created with various terms");
  console.log("• Revenue distributions simulated for all patents");
  console.log("• Ready for frontend demonstration!");

  console.log("\nPatent Token IDs for testing:");
  console.log("• Blockchain Patent: Token ID 1 (Owner: Deployer)");
  console.log("• AI Algorithm Patent: Token ID 2 (Owner: User1)");
  console.log("• Medical Device Patent: Token ID 3 (Owner: User2)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });