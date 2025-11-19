// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PatentRegistry
 * @dev On-chain registry for patent verification and timestamping
 */
contract PatentRegistry is Ownable {
    enum PatentStatus { PENDING, GRANTED, EXPIRED, REVOKED }
    
    struct PatentRecord {
        address owner;
        bytes32 patentHash;  // Hash of patent documents for verification
        string patentNumber;
        string title;
        string description;
        uint64 filingDate;
        uint64 grantDate;
        uint64 expirationDate;
        PatentStatus status;
        uint256 tokenId;     // Corresponding NFT token ID
    }
    
    // Mapping from record ID to patent record
    mapping(uint256 => PatentRecord) public patentRecords;
    
    // Mapping from patent hash to record ID for quick lookup
    mapping(bytes32 => uint256) public hashToRecordId;
    
    // Counter for record IDs
    uint256 private _nextRecordId = 1;
    
    // Events
    event PatentRegistered(
        uint256 indexed recordId,
        address indexed owner,
        bytes32 patentHash,
        string patentNumber,
        uint256 tokenId
    );
    
    event PatentStatusUpdated(
        uint256 indexed recordId,
        PatentStatus newStatus
    );
    
    event PatentVerified(
        uint256 indexed recordId,
        bytes32 patentHash,
        bool isValid
    );

    constructor() Ownable() {}

    /**
     * @dev Register a new patent record
     */
    function registerPatent(
        bytes32 patentHash,
        string memory patentNumber,
        string memory title,
        string memory description,
        uint64 filingDate,
        uint256 tokenId
    ) external returns (uint256) {
        require(patentHash != bytes32(0), "Invalid patent hash");
        require(hashToRecordId[patentHash] == 0, "Patent already registered");
        
        uint256 recordId = _nextRecordId++;
        
        patentRecords[recordId] = PatentRecord({
            owner: msg.sender,
            patentHash: patentHash,
            patentNumber: patentNumber,
            title: title,
            description: description,
            filingDate: filingDate,
            grantDate: 0,
            expirationDate: 0,
            status: PatentStatus.PENDING,
            tokenId: tokenId
        });
        
        hashToRecordId[patentHash] = recordId;
        
        emit PatentRegistered(recordId, msg.sender, patentHash, patentNumber, tokenId);
        
        return recordId;
    }

    /**
     * @dev Update patent status (only owner)
     */
    function updatePatentStatus(
        uint256 recordId,
        PatentStatus status,
        uint64 grantDate,
        uint64 expirationDate
    ) external onlyOwner {
        require(recordId < _nextRecordId && recordId > 0, "Invalid record ID");
        
        PatentRecord storage record = patentRecords[recordId];
        record.status = status;
        
        if (grantDate > 0) {
            record.grantDate = grantDate;
        }
        
        if (expirationDate > 0) {
            record.expirationDate = expirationDate;
        }
        
        emit PatentStatusUpdated(recordId, status);
    }

    /**
     * @dev Verify patent authenticity by comparing hash
     */
    function verifyPatent(
        uint256 recordId,
        bytes32 providedHash
    ) external view returns (bool) {
        require(recordId < _nextRecordId && recordId > 0, "Invalid record ID");
        
        PatentRecord memory record = patentRecords[recordId];
        bool isValid = record.patentHash == providedHash && 
                      record.status == PatentStatus.GRANTED;
        
        return isValid;
    }

    /**
     * @dev Get patent record by ID
     */
    function getPatentRecord(uint256 recordId) 
        external 
        view 
        returns (
            address owner,
            bytes32 patentHash,
            string memory patentNumber,
            string memory title,
            PatentStatus status,
            uint64 filingDate,
            uint64 grantDate,
            uint256 tokenId
        ) 
    {
        require(recordId < _nextRecordId && recordId > 0, "Invalid record ID");
        
        PatentRecord memory record = patentRecords[recordId];
        return (
            record.owner,
            record.patentHash,
            record.patentNumber,
            record.title,
            record.status,
            record.filingDate,
            record.grantDate,
            record.tokenId
        );
    }

    /**
     * @dev Find record ID by patent hash
     */
    function getRecordIdByHash(bytes32 patentHash) external view returns (uint256) {
        return hashToRecordId[patentHash];
    }

    /**
     * @dev Check if patent is active and granted
     */
    function isPatentActive(uint256 recordId) external view returns (bool) {
        if (recordId >= _nextRecordId || recordId == 0) return false;
        
        PatentRecord memory record = patentRecords[recordId];
        return record.status == PatentStatus.GRANTED && 
               (record.expirationDate == 0 || record.expirationDate > block.timestamp);
    }

    /**
     * @dev Get total number of registered patents
     */
    function getTotalPatents() external view returns (uint256) {
        return _nextRecordId - 1;
    }
}