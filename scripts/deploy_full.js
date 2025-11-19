const { ethers } = require("hardhat");

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  
  console.log("Deploying full PatentChain system with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Step 1: Deploy PatentToken
  console.log("\n1. Deploying PatentToken...");
  const PatentToken = await ethers.getContractFactory("PatentToken");
  const patentToken = await PatentToken.deploy();
  await patentToken.waitForDeployment();
  const patentTokenAddress = await patentToken.getAddress();
  
  // Transfer ownership to deployer
  await patentToken.transferOwnership(deployer.address);
  console.log("✓ PatentToken deployed to:", patentTokenAddress);

  // Step 2: Deploy PatentRegistry
  console.log("\n2. Deploying PatentRegistry...");
  const PatentRegistry = await ethers.getContractFactory("PatentRegistry");
  const patentRegistry = await PatentRegistry.deploy();
  await patentRegistry.waitForDeployment();
  const patentRegistryAddress = await patentRegistry.getAddress();
  
  // Transfer ownership to deployer
  await patentRegistry.transferOwnership(deployer.address);
  console.log("✓ PatentRegistry deployed to:", patentRegistryAddress);

  // Step 3: Deploy LicenseManager
  console.log("\n3. Deploying LicenseManager...");
  const LicenseManager = await ethers.getContractFactory("LicenseManager");
  const licenseManager = await LicenseManager.deploy(patentTokenAddress);
  await licenseManager.waitForDeployment();
  const licenseManagerAddress = await licenseManager.getAddress();
  console.log("✓ LicenseManager deployed to:", licenseManagerAddress);

  // Step 4: Deploy RoyaltyDistribution
  console.log("\n4. Deploying RoyaltyDistribution...");
  const RoyaltyDistribution = await ethers.getContractFactory("RoyaltyDistribution");
  const royaltyDistribution = await RoyaltyDistribution.deploy(patentTokenAddress);
  await royaltyDistribution.waitForDeployment();
  const royaltyDistributionAddress = await royaltyDistribution.getAddress();
  console.log("✓ RoyaltyDistribution deployed to:", royaltyDistributionAddress);

  // Step 5: Setup demo data
  console.log("\n5. Setting up demo data...");
  await setupDemoData(patentToken, patentRegistry, licenseManager, royaltyDistribution, deployer, user1, user2);
  
  console.log("\n🎉 Full PatentChain deployment completed!");
  
  const contracts = {
    PatentToken: patentTokenAddress,
    PatentRegistry: patentRegistryAddress,
    LicenseManager: licenseManagerAddress,
    RoyaltyDistribution: royaltyDistributionAddress
  };

  console.log("\nContract addresses for frontend configuration:");
  console.log(JSON.stringify(contracts, null, 2));

  return contracts;
}

async function setupDemoData(patentToken, patentRegistry, licenseManager, royaltyDistribution, deployer, user1, user2) {
  // Mint demo patent NFT
  console.log("  - Minting demo patent NFT...");
  const tokenId = 1;
  const patentHash = ethers.keccak256(ethers.toUtf8Bytes("Demo Patent Document Content"));
  
  // First mint with basic info
  await patentToken.mintPatent(
    deployer.address,
    tokenId,
    "ipfs://demo-patent-metadata",
    "US-2023-001",
    "Blockchain-based Patent Management System",
    "Alice Inventor",
    Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    Math.floor(Date.now() / 1000), // granted today
    500 // 5% royalty
  );
  
  // Then set revenue shares separately
  await patentToken.setRevenueShares(
    tokenId,
    [deployer.address, user1.address], // revenue shares
    [8000, 2000] // 80% to owner, 20% to user1
  );
  
  console.log("  ✓ Demo patent NFT minted with token ID:", tokenId);
  // Register patent in registry
  console.log("  - Registering patent in registry...");
  await patentRegistry.registerPatent(
    patentHash,
    "US-2023-001",
    "Blockchain-based Patent Management System",
    "A system for managing patents using blockchain technology",
    Math.floor(Date.now() / 1000) - 86400 * 30,
    tokenId
  );
  console.log("  ✓ Patent registered in registry");

  // Update patent status to granted
  console.log("  - Updating patent status to granted...");
  await patentRegistry.updatePatentStatus(
    1, // recordId
    1, // GRANTED
    Math.floor(Date.now() / 1000), // grant date
    Math.floor(Date.now() / 1000) + 86400 * 365 * 20 // 20 years expiration
  );
  console.log("  ✓ Patent status updated to GRANTED");

  // Create demo license agreement
  console.log("  - Creating demo license agreement...");
  await licenseManager.createLicense(
    tokenId,
    user2.address,
    1, // NON_EXCLUSIVE
    "Software Development",
    ethers.parseEther("1.0"), // 1 ETH license fee
    86400 * 365 // 1 year duration
  );
  console.log("  ✓ Demo license agreement created");

  // Setup revenue shares
  console.log("  - Setting up revenue shares...");
  await royaltyDistribution.setRevenueShares(
    tokenId,
    [deployer.address, user1.address],
    [8000, 2000] // 80% to owner, 20% to user1
  );
  console.log("  ✓ Revenue shares configured");

  console.log("  ✅ Demo data setup completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });