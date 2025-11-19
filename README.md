# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
```shell
PatentChain/
├── contracts/
│   ├── PatentToken.sol           # ERC-721 Patent NFT
│   ├── PatentRegistry.sol        # Patent registration & verification
│   ├── LicenseManager.sol        # License agreement management
│   └── RoyaltyDistribution.sol   # Automated royalty distribution
├── scripts/
│   ├── deploy.js                 # Basic deployment
│   ├── deploy_full.js            # Full contract deployment
│   └── setup_demo.js             # Demo data setup
├── test/
│   └── PatentChainFlow.js        # End-to-end tests
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx              # Vite entry point
│       ├── App.jsx               # React UI components
│       ├── components/
│       │   ├── PatentMinter.jsx  # Patent NFT minting
│       │   ├── LicenseMarket.jsx # License marketplace
│       │   └── RoyaltyDashboard.jsx # Revenue tracking
│       ├── App.css
│       └── contracts.js          # Contract addresses + ABIs
├── hardhat.config.js
├── package.json
└── README.md
```