const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PatentChain End-to-End Flow", function () {
  let patentToken;
  let patentRegistry;
  let licenseManager;
  let royaltyDistribution;
  let deployer, inventor, licensee, contributor1, contributor2;

  const patentData = {
    tokenId: 1,
    tokenURI: "ipfs://test-patent-metadata",
    patentNumber: "US-2023-TEST001",
    title: "Test Patent System",
    inventor: "Test Inventor",
    filingDate: Math.floor(Date.now() / 1000) - 86400 * 30,
    grantDate: Math.floor(Date.now() / 1000),
    royaltyPercentage: 500, // 5%
    revenueShares: [],
    sharePercentages: []
  };

  before(async function () {
    [deployer, inventor, licensee, contributor1, contributor2] = await ethers.getSigners();
    
    patentData.revenueShares = [inventor.address, contributor1.address];
    patentData.sharePercentages = [8000, 2000]; // 80% to inventor, 20% to contributor
  });

  it("Should deploy all contracts", async function () {
    // Deploy PatentToken
    const PatentToken = await ethers.getContractFactory("PatentToken");
    patentToken = await PatentToken.deploy();
    await patentToken.waitForDeployment();
    await patentToken.transferOwnership(deployer.address);

    // Deploy PatentRegistry
    const PatentRegistry = await ethers.getContractFactory("PatentRegistry");
    patentRegistry = await PatentRegistry.deploy();
    await patentRegistry.waitForDeployment();
    await patentRegistry.transferOwnership(deployer.address);

    // Deploy LicenseManager
    const LicenseManager = await ethers.getContractFactory("LicenseManager");
    licenseManager = await LicenseManager.deploy(await patentToken.getAddress());
    await licenseManager.waitForDeployment();

    // Deploy RoyaltyDistribution
    const RoyaltyDistribution = await ethers.getContractFactory("RoyaltyDistribution");
    royaltyDistribution = await RoyaltyDistribution.deploy(await patentToken.getAddress());
    await royaltyDistribution.waitForDeployment();

    expect(await patentToken.getAddress()).to.be.properAddress;
    expect(await patentRegistry.getAddress()).to.be.properAddress;
    expect(await licenseManager.getAddress()).to.be.properAddress;
    expect(await royaltyDistribution.getAddress()).to.be.properAddress;
  });

  it("Should mint a patent NFT", async function () {
    await patentToken.mintPatent(
      inventor.address,
      patentData.tokenId,
      patentData.tokenURI,
      patentData.patentNumber,
      patentData.title,
      patentData.inventor,
      patentData.filingDate,
      patentData.grantDate,
      patentData.royaltyPercentage
    );

    expect(await patentToken.ownerOf(patentData.tokenId)).to.equal(inventor.address);
    
    const patentInfo = await patentToken.getPatentInfo(patentData.tokenId);
    expect(patentInfo.patentNumber).to.equal(patentData.patentNumber);
    expect(patentInfo.title).to.equal(patentData.title);
  });

  it("Should set revenue shares for patent", async function () {
    await patentToken.setRevenueShares(
      patentData.tokenId,
      patentData.revenueShares,
      patentData.sharePercentages
    );

    const [recipients, percentages] = await patentToken.getRevenueShares(patentData.tokenId);
    expect(recipients.length).to.equal(2);
    expect(recipients[0]).to.equal(inventor.address);
    expect(percentages[0]).to.equal(8000);
  });

  it("Should register patent in registry", async function () {
    const patentHash = ethers.keccak256(ethers.toUtf8Bytes("Test Patent Document Content"));
    
    // 使用 inventor 账户注册专利（因为他是 NFT 所有者）
    const tx = await patentRegistry.connect(inventor).registerPatent(
      patentHash,
      patentData.patentNumber,
      patentData.title,
      "Test patent description for demonstration",
      patentData.filingDate,
      patentData.tokenId
    );

    await expect(tx)
      .to.emit(patentRegistry, "PatentRegistered")
      .withArgs(1, inventor.address, patentHash, patentData.patentNumber, patentData.tokenId);

    // Update status to granted (使用所有者账户)
    await patentRegistry.updatePatentStatus(
      1, // recordId
      1, // GRANTED
      patentData.grantDate,
      patentData.grantDate + 86400 * 365 * 20 // 20 years
    );

    const record = await patentRegistry.getPatentRecord(1);
    expect(record.status).to.equal(1); // GRANTED
    expect(record.owner).to.equal(inventor.address);
  });

  it("Should verify patent authenticity", async function () {
    const correctHash = ethers.keccak256(ethers.toUtf8Bytes("Test Patent Document Content"));
    const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("Wrong Document Content"));

    // 等待区块确认
    await ethers.provider.send("evm_mine", []);
    
    const isValid = await patentRegistry.verifyPatent(1, correctHash);
    const isInvalid = await patentRegistry.verifyPatent(1, wrongHash);
    
    expect(isValid).to.be.true;
    expect(isInvalid).to.be.false;
  });

  it("Should create a license agreement", async function () {
    const licenseFee = ethers.parseEther("1.0");
    const duration = 86400 * 365; // 1 year

    const tx = await licenseManager.connect(inventor).createLicense(
      patentData.tokenId,
      licensee.address,
      1, // NON_EXCLUSIVE
      "Software Development",
      licenseFee,
      duration
    );

    await expect(tx)
      .to.emit(licenseManager, "LicenseCreated")
      .withArgs(1, patentData.tokenId, inventor.address, licensee.address, 1, licenseFee);

    const agreement = await licenseManager.getLicenseAgreement(1);
    expect(agreement.patentTokenId).to.equal(patentData.tokenId);
    expect(agreement.licensor).to.equal(inventor.address);
    expect(agreement.licensee).to.equal(licensee.address);
    expect(agreement.licenseFee).to.equal(licenseFee);
    expect(agreement.isPaid).to.be.false;
  });

  it("Should purchase and activate a license", async function () {
    const licenseFee = ethers.parseEther("1.0");
    
    // Transfer some ETH to licensee for payment
    await deployer.sendTransaction({
      to: licensee.address,
      value: ethers.parseEther("2.0")
    });

    const tx = await licenseManager.connect(licensee).purchaseLicense(1, {
      value: licenseFee
    });

    await expect(tx)
      .to.emit(licenseManager, "LicensePurchased")
      .withArgs(1, licensee.address, licenseFee);

    const agreement = await licenseManager.getLicenseAgreement(1);
    expect(agreement.isPaid).to.be.true;
    expect(agreement.startDate).to.be.gt(0);

    // Check if license is valid
    expect(await licenseManager.isLicenseValid(1)).to.be.true;
  });

  it("Should check license validity for different users", async function () {
    // Licensee should have valid license
    expect(await licenseManager.hasValidLicense(patentData.tokenId, licensee.address)).to.be.true;
    
    // Other users should not have license
    expect(await licenseManager.hasValidLicense(patentData.tokenId, contributor1.address)).to.be.false;
    expect(await licenseManager.hasValidLicense(patentData.tokenId, deployer.address)).to.be.false;
  });

  it("Should setup revenue sharing", async function () {
    await royaltyDistribution.connect(inventor).setRevenueShares(
      patentData.tokenId,
      patentData.revenueShares,
      patentData.sharePercentages
    );

    const shares = await royaltyDistribution.getRevenueShares(patentData.tokenId);
    expect(shares.length).to.equal(2);
    expect(shares[0].recipient).to.equal(inventor.address);
    expect(shares[0].sharePercentage).to.equal(8000);
    expect(shares[1].recipient).to.equal(contributor1.address);
    expect(shares[1].sharePercentage).to.equal(2000);
  });

  it("Should distribute revenue to shareholders", async function () {
    const distributionAmount = ethers.parseEther("1.0");
    
    const inventorInitialBalance = await ethers.provider.getBalance(inventor.address);
    const contributorInitialBalance = await ethers.provider.getBalance(contributor1.address);

    const tx = await royaltyDistribution.distributeRevenue(patentData.tokenId, {
      value: distributionAmount
    });

    await expect(tx)
      .to.emit(royaltyDistribution, "RevenueDistributed")
      .withArgs(1, patentData.tokenId, distributionAmount, await ethers.provider.getBlock("latest").then(b => b.timestamp));

    // Check balances after distribution
    const inventorFinalBalance = await ethers.provider.getBalance(inventor.address);
    const contributorFinalBalance = await ethers.provider.getBalance(contributor1.address);

    // Inventor should receive 80% (0.8 ETH)
    expect(inventorFinalBalance - inventorInitialBalance).to.be.closeTo(
      ethers.parseEther("0.8"),
      ethers.parseEther("0.01") // Allow for gas costs
    );

    // Contributor should receive 20% (0.2 ETH)
    expect(contributorFinalBalance - contributorInitialBalance).to.equal(
      ethers.parseEther("0.2")
    );
  });

  it("Should track distribution history", async function () {
    const history = await royaltyDistribution.getDistributionHistory(patentData.tokenId);
    expect(history.length).to.equal(1);
    expect(history[0]).to.equal(1);

    const distribution = await royaltyDistribution.getDistributionDetails(1);
    expect(distribution.patentTokenId).to.equal(patentData.tokenId);
    expect(distribution.totalAmount).to.equal(ethers.parseEther("1.0"));
  });

  it("Should calculate expected distribution amounts", async function () {
    const testAmount = ethers.parseEther("2.0");
    
    const [recipients, amounts] = await royaltyDistribution.calculateDistribution(
      patentData.tokenId,
      testAmount
    );

    expect(recipients.length).to.equal(2);
    expect(amounts.length).to.equal(2);
    expect(recipients[0]).to.equal(inventor.address);
    expect(amounts[0]).to.equal(ethers.parseEther("1.6")); // 80% of 2.0
    expect(recipients[1]).to.equal(contributor1.address);
    expect(amounts[1]).to.equal(ethers.parseEther("0.4")); // 20% of 2.0
  });

  it("Should handle royalty info correctly", async function () {
    const salePrice = ethers.parseEther("10.0");
    const [receiver, royaltyAmount] = await patentToken.royaltyInfo(patentData.tokenId, salePrice);

    expect(receiver).to.equal(inventor.address);
    expect(royaltyAmount).to.equal(salePrice * BigInt(500) / BigInt(10000)); // 5% of 10.0 = 0.5 ETH
  });

  it("Should update license status", async function () {
    await licenseManager.connect(inventor).updateLicenseStatus(1, 2); // EXPIRED

    const agreement = await licenseManager.getLicenseAgreement(1);
    expect(agreement.status).to.equal(2); // EXPIRED
    expect(await licenseManager.isLicenseValid(1)).to.be.false;
  });

  it("Should handle multiple patents and licenses", async function () {
    // Create second patent
    const tokenId2 = 2;
    await patentToken.mintPatent(
      contributor2.address,
      tokenId2,
      "ipfs://second-patent",
      "US-2023-TEST002",
      "Second Test Patent",
      "Second Inventor",
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000),
      300 // 3%
    );

    // Create multiple licenses for second patent
    await licenseManager.connect(contributor2).createLicense(
      tokenId2,
      licensee.address,
      0, // EXCLUSIVE
      "Manufacturing",
      ethers.parseEther("5.0"),
      86400 * 730 // 2 years
    );

    await licenseManager.connect(contributor2).createLicense(
      tokenId2,
      inventor.address,
      1, // NON_EXCLUSIVE
      "Research",
      ethers.parseEther("2.0"),
      86400 * 365 // 1 year
    );

    const patentLicenses = await licenseManager.getLicensesForPatent(tokenId2);
    expect(patentLicenses.length).to.equal(2);

    const licenseeAgreements = await licenseManager.getLicensesForLicensee(licensee.address);
    expect(licenseeAgreements.length).to.be.at.least(1);
  });

  it("Should verify comprehensive system state", async function () {
    // Check total patents
    const totalPatents = await patentRegistry.getTotalPatents();
    expect(totalPatents).to.equal(1); // Only one registered in registry

    // Check NFT ownership
    expect(await patentToken.ownerOf(1)).to.equal(inventor.address);
    expect(await patentToken.ownerOf(2)).to.equal(contributor2.address);

    // Check patent status - 添加等待时间确保状态更新
    await ethers.provider.send("evm_mine", []);
    const isActive = await patentRegistry.isPatentActive(1);
    expect(isActive).to.be.true;

    // Check revenue tracking
    const totalReceived = await royaltyDistribution.getTotalReceived(inventor.address);
    expect(totalReceived).to.be.gt(0);
  });
});