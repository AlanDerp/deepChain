// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title PatentToken
 * @dev ERC-721 token representing patent ownership with royalty support
 */
contract PatentToken is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, IERC2981 {
    // Patent information structure
    struct PatentInfo {
        string patentNumber;
        string title;
        string inventor;
        uint64 filingDate;
        uint64 grantDate;
        uint256 royaltyPercentage; // Basis points (10000 = 100%)
        address[] revenueShares;   // Addresses for revenue sharing
        uint256[] sharePercentages; // Corresponding percentages
    }

    // Mapping from token ID to patent information
    mapping(uint256 => PatentInfo) public patentInfo;
    
    // Royalty info event
    event RoyaltyInfoSet(uint256 indexed tokenId, uint256 royaltyPercentage);
    event RevenueSharesSet(uint256 indexed tokenId, address[] recipients, uint256[] percentages);

    constructor() ERC721("PatentToken", "PTNT") Ownable() {}

    /**
     * @dev Mint a new patent token with basic info
     */
    function mintPatent(
        address to,
        uint256 tokenId,
        string calldata uri,
        string calldata patentNumber,
        string calldata title,
        string calldata inventor,
        uint64 filingDate,
        uint64 grantDate,
        uint256 royaltyPercentage
    ) public onlyOwner {
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Initialize with empty arrays, can be set later
        address[] memory emptyAddresses = new address[](0);
        uint256[] memory emptyPercentages = new uint256[](0);
        
        patentInfo[tokenId] = PatentInfo({
            patentNumber: patentNumber,
            title: title,
            inventor: inventor,
            filingDate: filingDate,
            grantDate: grantDate,
            royaltyPercentage: royaltyPercentage,
            revenueShares: emptyAddresses,
            sharePercentages: emptyPercentages
        });

        emit RoyaltyInfoSet(tokenId, royaltyPercentage);
    }

    /**
     * @dev Set revenue shares for a patent token
     */
    function setRevenueShares(
        uint256 tokenId,
        address[] calldata revenueShares,
        uint256[] calldata sharePercentages
    ) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(revenueShares.length == sharePercentages.length, "Arrays length mismatch");
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < sharePercentages.length; i++) {
            totalPercentage += sharePercentages[i];
        }
        require(totalPercentage == 10000, "Total percentage must be 10000 (100%)");
        
        patentInfo[tokenId].revenueShares = revenueShares;
        patentInfo[tokenId].sharePercentages = sharePercentages;
        
        emit RevenueSharesSet(tokenId, revenueShares, sharePercentages);
    }

    /**
     * @dev EIP-2981 royalty info
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice) 
        external 
        view 
        override 
        returns (address receiver, uint256 royaltyAmount) 
    {
        require(_exists(tokenId), "Token does not exist");
        royaltyAmount = (salePrice * patentInfo[tokenId].royaltyPercentage) / 10000;
        receiver = ownerOf(tokenId);
    }

    /**
     * @dev Get patent information
     */
    function getPatentInfo(uint256 tokenId) 
        external 
        view 
        returns (
            string memory patentNumber,
            string memory title,
            string memory inventor,
            uint64 filingDate,
            uint64 grantDate,
            uint256 royaltyPercentage
        ) 
    {
        require(_exists(tokenId), "Token does not exist");
        PatentInfo memory info = patentInfo[tokenId];
        return (
            info.patentNumber,
            info.title,
            info.inventor,
            info.filingDate,
            info.grantDate,
            info.royaltyPercentage
        );
    }

    /**
     * @dev Get revenue sharing information
     */
    function getRevenueShares(uint256 tokenId) 
        external 
        view 
        returns (address[] memory recipients, uint256[] memory percentages) 
    {
        require(_exists(tokenId), "Token does not exist");
        return (patentInfo[tokenId].revenueShares, patentInfo[tokenId].sharePercentages);
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, IERC165)
        returns (bool)
    {
        return 
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}