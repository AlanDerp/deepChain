const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy PatentToken
  const PatentToken = await ethers.getContractFactory("PatentToken");
  const patentToken = await PatentToken.deploy();
  await patentToken.waitForDeployment();
  const patentTokenAddress = await patentToken.getAddress();
  
  console.log("PatentToken deployed to:", patentTokenAddress);

  // Transfer ownership to deployer
  await patentToken.transferOwnership(deployer.address);
  console.log("PatentToken ownership transferred to:", deployer.address);

  // Deploy PatentRegistry
  const PatentRegistry = await ethers.getContractFactory("PatentRegistry");
  const patentRegistry = await PatentRegistry.deploy();
  await patentRegistry.waitForDeployment();
  const patentRegistryAddress = await patentRegistry.getAddress();
  
  console.log("PatentRegistry deployed to:", patentRegistryAddress);

  // Transfer ownership to deployer
  await patentRegistry.transferOwnership(deployer.address);
  console.log("PatentRegistry ownership transferred to:", deployer.address);

  // Deploy LicenseManager
  const LicenseManager = await ethers.getContractFactory("LicenseManager");
  const licenseManager = await LicenseManager.deploy(patentTokenAddress);
  await licenseManager.waitForDeployment();
  const licenseManagerAddress = await licenseManager.getAddress();
  
  console.log("LicenseManager deployed to:", licenseManagerAddress);

  // Deploy RoyaltyDistribution
  const RoyaltyDistribution = await ethers.getContractFactory("RoyaltyDistribution");
  const royaltyDistribution = await RoyaltyDistribution.deploy(patentTokenAddress);
  await royaltyDistribution.waitForDeployment();
  const royaltyDistributionAddress = await royaltyDistribution.getAddress();
  
  console.log("RoyaltyDistribution deployed to:", royaltyDistributionAddress);

  // Save contract addresses for frontend
  const contracts = {
    PatentToken: patentTokenAddress,
    PatentRegistry: patentRegistryAddress,
    LicenseManager: licenseManagerAddress,
    RoyaltyDistribution: royaltyDistributionAddress
  };

  console.log("\nDeployment completed! Contract addresses:");
  console.log(JSON.stringify(contracts, null, 2));

  return contracts;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });