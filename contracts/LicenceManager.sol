// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title LicenseManager
 * @dev Manages patent licensing agreements and transactions
 */
contract LicenseManager is Ownable {
    enum LicenseType { EXCLUSIVE, NON_EXCLUSIVE, FIELD_SPECIFIC }
    enum LicenseStatus { ACTIVE, EXPIRED, REVOKED, TERMINATED }
    
    struct LicenseAgreement {
        uint256 licenseId;
        uint256 patentTokenId;
        address licensor;
        address licensee;
        LicenseType licenseType;
        string fieldOfUse; // Specific field for FIELD_SPECIFIC licenses
        uint256 licenseFee;
        uint64 startDate;
        uint64 duration; // Duration in seconds
        LicenseStatus status;
        bool isPaid;
    }
    
    // Interface for PatentToken
    IERC721 public patentToken;
    
    // Mapping from license ID to agreement
    mapping(uint256 => LicenseAgreement) public licenseAgreements;
    
    // Mapping from patent token ID to active license IDs
    mapping(uint256 => uint256[]) public patentLicenses;
    
    // Mapping from licensee to their license IDs
    mapping(address => uint256[]) public licenseeAgreements;
    
    // Counter for license IDs
    uint256 private _nextLicenseId = 1;
    
    // Events
    event LicenseCreated(
        uint256 indexed licenseId,
        uint256 indexed patentTokenId,
        address indexed licensor,
        address licensee,
        LicenseType licenseType,
        uint256 licenseFee
    );
    
    event LicensePurchased(
        uint256 indexed licenseId,
        address indexed licensee,
        uint256 feePaid
    );
    
    event LicenseStatusChanged(
        uint256 indexed licenseId,
        LicenseStatus newStatus
    );

    constructor(address patentTokenAddress) {
        patentToken = IERC721(patentTokenAddress);
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Create a new license agreement
     */
    function createLicense(
        uint256 patentTokenId,
        address licensee,
        LicenseType licenseType,
        string memory fieldOfUse,
        uint256 licenseFee,
        uint64 duration
    ) external returns (uint256) {
        require(patentToken.ownerOf(patentTokenId) == msg.sender, "Not patent owner");
        require(licensee != address(0), "Invalid licensee address");
        require(duration > 0, "Invalid duration");
        
        uint256 licenseId = _nextLicenseId++;
        
        LicenseAgreement memory agreement = LicenseAgreement({
            licenseId: licenseId,
            patentTokenId: patentTokenId,
            licensor: msg.sender,
            licensee: licensee,
            licenseType: licenseType,
            fieldOfUse: fieldOfUse,
            licenseFee: licenseFee,
            startDate: 0, // Will be set upon payment
            duration: duration,
            status: LicenseStatus.ACTIVE,
            isPaid: false
        });
        
        licenseAgreements[licenseId] = agreement;
        patentLicenses[patentTokenId].push(licenseId);
        licenseeAgreements[licensee].push(licenseId);
        
        emit LicenseCreated(licenseId, patentTokenId, msg.sender, licensee, licenseType, licenseFee);
        
        return licenseId;
    }

    /**
     * @dev Purchase and activate a license (simplified - in real implementation would handle actual payments)
     */
    function purchaseLicense(uint256 licenseId) external payable {
        require(licenseId < _nextLicenseId && licenseId > 0, "Invalid license ID");
        
        LicenseAgreement storage agreement = licenseAgreements[licenseId];
        require(agreement.licensee == msg.sender, "Not designated licensee");
        require(agreement.status == LicenseStatus.ACTIVE, "License not active");
        require(!agreement.isPaid, "License already paid");
        require(msg.value >= agreement.licenseFee, "Insufficient payment");
        
        agreement.isPaid = true;
        agreement.startDate = uint64(block.timestamp);
        
        // Transfer payment to licensor (simplified)
        payable(agreement.licensor).transfer(msg.value);
        
        // Refund excess payment
        if (msg.value > agreement.licenseFee) {
            payable(msg.sender).transfer(msg.value - agreement.licenseFee);
        }
        
        emit LicensePurchased(licenseId, msg.sender, agreement.licenseFee);
    }

    /**
     * @dev Check if a license is valid and active
     */
    function isLicenseValid(uint256 licenseId) external view returns (bool) {
        if (licenseId >= _nextLicenseId || licenseId == 0) return false;
        
        LicenseAgreement memory agreement = licenseAgreements[licenseId];
        
        return agreement.isPaid && 
               agreement.status == LicenseStatus.ACTIVE &&
               (agreement.startDate + agreement.duration > block.timestamp);
    }

    /**
     * @dev Update license status
     */
    function updateLicenseStatus(uint256 licenseId, LicenseStatus newStatus) external {
        require(licenseId < _nextLicenseId && licenseId > 0, "Invalid license ID");
        
        LicenseAgreement storage agreement = licenseAgreements[licenseId];
        require(agreement.licensor == msg.sender || msg.sender == owner(), "Not authorized");
        
        agreement.status = newStatus;
        
        emit LicenseStatusChanged(licenseId, newStatus);
    }

    /**
     * @dev Get all licenses for a patent
     */
    function getLicensesForPatent(uint256 patentTokenId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return patentLicenses[patentTokenId];
    }

    /**
     * @dev Get license agreement details
     */
    function getLicenseAgreement(uint256 licenseId) 
        external 
        view 
        returns (
            uint256 patentTokenId,
            address licensor,
            address licensee,
            LicenseType licenseType,
            string memory fieldOfUse,
            uint256 licenseFee,
            uint64 startDate,
            uint64 duration,
            LicenseStatus status,
            bool isPaid
        ) 
    {
        require(licenseId < _nextLicenseId && licenseId > 0, "Invalid license ID");
        
        LicenseAgreement memory agreement = licenseAgreements[licenseId];
        return (
            agreement.patentTokenId,
            agreement.licensor,
            agreement.licensee,
            agreement.licenseType,
            agreement.fieldOfUse,
            agreement.licenseFee,
            agreement.startDate,
            agreement.duration,
            agreement.status,
            agreement.isPaid
        );
    }

    /**
     * @dev Get licenses for a licensee
     */
    function getLicensesForLicensee(address licensee) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return licenseeAgreements[licensee];
    }

    /**
     * @dev Check if address has valid license for patent
     */
    function hasValidLicense(uint256 patentTokenId, address licensee) 
        external 
        view 
        returns (bool) 
    {
        uint256[] memory licenseIds = licenseeAgreements[licensee];
        
        for (uint256 i = 0; i < licenseIds.length; i++) {
            LicenseAgreement memory agreement = licenseAgreements[licenseIds[i]];
            if (agreement.patentTokenId == patentTokenId && 
                agreement.isPaid && 
                agreement.status == LicenseStatus.ACTIVE &&
                (agreement.startDate + agreement.duration > block.timestamp)) {
                return true;
            }
        }
        
        return false;
    }
}