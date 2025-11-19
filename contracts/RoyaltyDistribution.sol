// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title RoyaltyDistribution
 * @dev Handles automated royalty distribution for patent licensing revenues
 */
contract RoyaltyDistribution is Ownable {
    struct DistributionRecord {
        uint256 distributionId;
        uint256 patentTokenId;
        uint256 totalAmount;
        uint256 distributionTimestamp;
        address distributedBy;
    }
    
    struct RevenueShare {
        address recipient;
        uint256 sharePercentage; // Basis points (10000 = 100%)
    }
    
    // Interface for PatentToken
    IERC721 public patentToken;
    
    // Mapping from distribution ID to distribution record
    mapping(uint256 => DistributionRecord) public distributions;
    
    // Mapping from patent token ID to distribution IDs
    mapping(uint256 => uint256[]) public patentDistributions;
    
    // Mapping from patent token ID to revenue shares
    mapping(uint256 => RevenueShare[]) public revenueShares;
    
    // Mapping from recipient to received amounts
    mapping(address => uint256) public totalReceived;
    
    // Counter for distribution IDs
    uint256 private _nextDistributionId = 1;
    
    // Events
    event RevenueDistributed(
        uint256 indexed distributionId,
        uint256 indexed patentTokenId,
        uint256 totalAmount,
        uint256 distributionTimestamp
    );
    
    event RecipientPaid(
        uint256 indexed distributionId,
        address indexed recipient,
        uint256 amount
    );
    
    event RevenueSharesUpdated(
        uint256 indexed patentTokenId,
        address[] recipients,
        uint256[] percentages
    );

    constructor(address patentTokenAddress) {
        patentToken = IERC721(patentTokenAddress);
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Set revenue sharing structure for a patent
     */
    function setRevenueShares(
        uint256 patentTokenId,
        address[] memory recipients,
        uint256[] memory percentages
    ) external {
        require(patentToken.ownerOf(patentTokenId) == msg.sender, "Not patent owner");
        require(recipients.length == percentages.length, "Arrays length mismatch");
        
        // Clear existing shares
        delete revenueShares[patentTokenId];
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(percentages[i] > 0, "Invalid percentage");
            
            revenueShares[patentTokenId].push(RevenueShare({
                recipient: recipients[i],
                sharePercentage: percentages[i]
            }));
            
            totalPercentage += percentages[i];
        }
        
        require(totalPercentage == 10000, "Total percentage must be 10000 (100%)");
        
        emit RevenueSharesUpdated(patentTokenId, recipients, percentages);
    }

    /**
     * @dev Distribute revenues for a patent (simplified - in real implementation would handle actual payments)
     */
    function distributeRevenue(uint256 patentTokenId) external payable {
        require(msg.value > 0, "No revenue to distribute");
        require(revenueShares[patentTokenId].length > 0, "No revenue shares set");
        
        uint256 distributionId = _nextDistributionId++;
        
        DistributionRecord memory record = DistributionRecord({
            distributionId: distributionId,
            patentTokenId: patentTokenId,
            totalAmount: msg.value,
            distributionTimestamp: block.timestamp,
            distributedBy: msg.sender
        });
        
        distributions[distributionId] = record;
        patentDistributions[patentTokenId].push(distributionId);
        
        // Distribute to recipients
        RevenueShare[] memory shares = revenueShares[patentTokenId];
        uint256 distributed = 0;
        
        for (uint256 i = 0; i < shares.length; i++) {
            uint256 shareAmount = (msg.value * shares[i].sharePercentage) / 10000;
            
            if (i == shares.length - 1) {
                // Last recipient gets remaining to avoid rounding errors
                shareAmount = msg.value - distributed;
            } else {
                distributed += shareAmount;
            }
            
            payable(shares[i].recipient).transfer(shareAmount);
            totalReceived[shares[i].recipient] += shareAmount;
            
            emit RecipientPaid(distributionId, shares[i].recipient, shareAmount);
        }
        
        emit RevenueDistributed(distributionId, patentTokenId, msg.value, block.timestamp);
    }

    /**
     * @dev Get revenue shares for a patent
     */
    function getRevenueShares(uint256 patentTokenId) 
        external 
        view 
        returns (RevenueShare[] memory) 
    {
        return revenueShares[patentTokenId];
    }

    /**
     * @dev Get distribution history for a patent
     */
    function getDistributionHistory(uint256 patentTokenId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return patentDistributions[patentTokenId];
    }

    /**
     * @dev Get distribution details
     */
    function getDistributionDetails(uint256 distributionId) 
        external 
        view 
        returns (
            uint256 patentTokenId,
            uint256 totalAmount,
            uint256 distributionTimestamp,
            address distributedBy
        ) 
    {
        require(distributionId < _nextDistributionId && distributionId > 0, "Invalid distribution ID");
        
        DistributionRecord memory record = distributions[distributionId];
        return (
            record.patentTokenId,
            record.totalAmount,
            record.distributionTimestamp,
            record.distributedBy
        );
    }

    /**
     * @dev Calculate expected distribution amounts
     */
    function calculateDistribution(uint256 patentTokenId, uint256 totalAmount) 
        external 
        view 
        returns (address[] memory recipients, uint256[] memory amounts) 
    {
        RevenueShare[] memory shares = revenueShares[patentTokenId];
        recipients = new address[](shares.length);
        amounts = new uint256[](shares.length);
        
        uint256 distributed = 0;
        
        for (uint256 i = 0; i < shares.length; i++) {
            recipients[i] = shares[i].recipient;
            
            if (i == shares.length - 1) {
                amounts[i] = totalAmount - distributed;
            } else {
                amounts[i] = (totalAmount * shares[i].sharePercentage) / 10000;
                distributed += amounts[i];
            }
        }
        
        return (recipients, amounts);
    }

    /**
     * @dev Get total received by an address
     */
    function getTotalReceived(address recipient) external view returns (uint256) {
        return totalReceived[recipient];
    }

    /**
     * @dev Receive ether
     */
    receive() external payable {}
}