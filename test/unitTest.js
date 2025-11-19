const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PatentChain Unit Tests", function () {
  let patentToken, patentRegistry, licenseManager, royaltyDistribution;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const PatentToken = await ethers.getContractFactory("PatentToken");
    patentToken = await PatentToken.deploy(owner.address);
    
    const PatentRegistry = await ethers.getContractFactory("PatentRegistry");
    patentRegistry = await PatentRegistry.deploy(owner.address);
    
    const LicenseManager = await ethers.getContractFactory("LicenseManager");
    licenseManager = await LicenseManager.deploy(owner.address, await patentToken.getAddress());
    
    const RoyaltyDistribution = await ethers.getContractFactory("RoyaltyDistribution");
    royaltyDistribution = await RoyaltyDistribution.deploy(owner.address, await patentToken.getAddress());
  });

  describe("PatentToken", function () {
    it("Should mint patent NFT with correct metadata", async function () {
      await patentToken.mintPatent(
        user1.address,
        1,
        "ipfs://test",
        "US-001",
        "Test Patent",
        "Test Inventor",
        1234567890,
        1234567890,
        500,
        [user1.address],
        [10000]
      );

      expect(await patentToken.ownerOf(1)).to.equal(user1.address);
      expect(await patentToken.tokenURI(1)).to.equal("ipfs://test");
    });

    it("Should return correct royalty info", async function () {
      await patentToken.mintPatent(
        user1.address,
        1,
        "ipfs://test",
        "US-001",
        "Test Patent",
        "Test Inventor",
        1234567890,
        1234567890,
        750, // 7.5%
        [user1.address],
        [10000]
      );

      const salePrice = ethers.parseEther("10.0");
      const [receiver, royaltyAmount] = await patentToken.royaltyInfo(1, salePrice);
      
      expect(receiver).to.equal(user1.address);
      expect(royaltyAmount).to.equal(ethers.parseEther("0.75")); // 7.5% of 10.0
    });

    it("Should reject minting by non-owner", async function () {
      await expect(
        patentToken.connect(user1).mintPatent(
          user1.address,
          1,
          "ipfs://test",
          "US-001",
          "Test Patent",
          "Test Inventor",
          1234567890,
          1234567890,
          500,
          [user1.address],
          [10000]
        )
      ).to.be.revertedWithCustomError(patentToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("PatentRegistry", function () {
    beforeEach(async function () {
      await patentToken.mintPatent(
        user1.address,
        1,
        "ipfs://test",
        "US-001",
        "Test Patent",
        "Test Inventor",
        1234567890,
        1234567890,
        500,
        [user1.address],
        [10000]
      );
    });

    it("Should register patent correctly", async function () {
      const patentHash = ethers.keccak256(ethers.toUtf8Bytes("test content"));
      
      await patentRegistry.connect(user1).registerPatent(
        patentHash,
        "US-001",
        "Test Patent",
        "Test description",
        1234567890,
        1
      );

      const record = await patentRegistry.getPatentRecord(1);
      expect(record.owner).to.equal(user1.address);
      expect(record.patentNumber).to.equal("US-001");
    });

    it("Should only allow owner to update patent status", async function () {
      await patentRegistry.connect(user1).registerPatent(
        ethers.keccak256(ethers.toUtf8Bytes("test")),
        "US-001",
        "Test Patent",
        "Test description",
        1234567890,
        1
      );

      await expect(
        patentRegistry.connect(user1).updatePatentStatus(1, 1, 1234567890, 1234567890)
      ).to.be.revertedWithCustomError(patentRegistry, "OwnableUnauthorizedAccount");
    });

    it("Should verify patent authenticity", async function () {
      const correctHash = ethers.keccak256(ethers.toUtf8Bytes("correct content"));
      
      await patentRegistry.connect(user1).registerPatent(
        correctHash,
        "US-001",
        "Test Patent",
        "Test description",
        1234567890,
        1
      );

      await patentRegistry.updatePatentStatus(1, 1, 1234567890, 1234567890);

      expect(await patentRegistry.verifyPatent(1, correctHash)).to.be.true;
      expect(await patentRegistry.verifyPatent(1, ethers.keccak256(ethers.toUtf8Bytes("wrong")))).to.be.false;
    });
  });

  describe("LicenseManager", function () {
    beforeEach(async function () {
      await patentToken.mintPatent(
        user1.address,
        1,
        "ipfs://test",
        "US-001",
        "Test Patent",
        "Test Inventor",
        1234567890,
        1234567890,
        500,
        [user1.address],
        [10000]
      );
    });

    it("Should create license agreement", async function () {
      await licenseManager.connect(user1).createLicense(
        1,
        user2.address,
        1, // NON_EXCLUSIVE
        "Software",
        ethers.parseEther("1.0"),
        86400 * 365
      );

      const agreement = await licenseManager.getLicenseAgreement(1);
      expect(agreement.licensor).to.equal(user1.address);
      expect(agreement.licensee).to.equal(user2.address);
      expect(agreement.licenseFee).to.equal(ethers.parseEther("1.0"));
    });

    it("Should reject license creation by non-owner", async function () {
      await expect(
        licenseManager.connect(user2).createLicense(
          1,
          user3.address,
          1,
          "Software",
          ethers.parseEther("1.0"),
          86400 * 365
        )
      ).to.be.revertedWith("Not patent owner");
    });

    it("Should handle license purchase correctly", async function () {
      await licenseManager.connect(user1).createLicense(
        1,
        user2.address,
        1,
        "Software",
        ethers.parseEther("1.0"),
        86400 * 365
      );

      // Fund user2
      await owner.sendTransaction({
        to: user2.address,
        value: ethers.parseEther("2.0")
      });

      await licenseManager.connect(user2).purchaseLicense(1, {
        value: ethers.parseEther("1.0")
      });

      const agreement = await licenseManager.getLicenseAgreement(1);
      expect(agreement.isPaid).to.be.true;
      expect(await licenseManager.isLicenseValid(1)).to.be.true;
    });
  });

  describe("RoyaltyDistribution", function () {
    beforeEach(async function () {
      await patentToken.mintPatent(
        user1.address,
        1,
        "ipfs://test",
        "US-001",
        "Test Patent",
        "Test Inventor",
        1234567890,
        1234567890,
        500,
        [user1.address],
        [10000]
      );
    });

    it("Should set revenue shares correctly", async function () {
      await royaltyDistribution.connect(user1).setRevenueShares(
        1,
        [user1.address, user2.address],
        [7000, 3000]
      );

      const shares = await royaltyDistribution.getRevenueShares(1);
      expect(shares.length).to.equal(2);
      expect(shares[0].recipient).to.equal(user1.address);
      expect(shares[0].sharePercentage).to.equal(7000);
    });

    it("Should reject revenue share setup by non-owner", async function () {
      await expect(
        royaltyDistribution.connect(user2).setRevenueShares(
          1,
          [user2.address],
          [10000]
        )
      ).to.be.revertedWith("Not patent owner");
    });

    it("Should distribute revenue correctly", async function () {
      await royaltyDistribution.connect(user1).setRevenueShares(
        1,
        [user1.address, user2.address],
        [7000, 3000]
      );

      const user1Initial = await ethers.provider.getBalance(user1.address);
      const user2Initial = await ethers.provider.getBalance(user2.address);

      await royaltyDistribution.distributeRevenue(1, {
        value: ethers.parseEther("1.0")
      });

      const user1Final = await ethers.provider.getBalance(user1.address);
      const user2Final = await ethers.provider.getBalance(user2.address);

      // User1 should receive approximately 0.7 ETH (minus gas)
      expect(user1Final - user1Initial).to.be.closeTo(
        ethers.parseEther("0.7"),
        ethers.parseEther("0.01")
      );

      // User2 should receive exactly 0.3 ETH
      expect(user2Final - user2Initial).to.equal(ethers.parseEther("0.3"));
    });
  });
});