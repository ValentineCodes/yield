// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @author  Yield
 * @title   Safe MultiSig Wallet
 * @dev     This contract is the multisig wallet that manages users funds on Yield
            Owners can add signers, remove signers, update number of signatures required and execute transactions
*/
contract SafeMultiSigWallet {
    using ECDSA for bytes32;

    event Deposit(address indexed sender, uint amount, uint balance);
    event ExecuteTransaction(address indexed owner, address payable to, uint256 value, bytes data, uint256 nonce, bytes32 hash, bytes result);
    event Owner(address indexed owner, bool added);

    mapping(address => bool) public isOwner;

    uint public signaturesRequired;
    uint public nonce;
    uint public chainId;

    /**
        @notice Initialize contract
        @param _chainId Network chain id
        @param _owners Owners of this wallet
        @param _signaturesRequired Number of signatures required to execute a transaction
    */
    constructor(uint256 _chainId, address[] memory _owners, uint _signaturesRequired) {
        require(_signaturesRequired > 0, "constructor: must be non-zero sigs required");

        signaturesRequired = _signaturesRequired;

        // add owners of this wallet
        uint256 ownersLength = _owners.length;
        for (uint i = 0; i < ownersLength; i++) {
            address owner = _owners[i];
            require(owner != address(0), "constructor: zero address");
            require(!isOwner[owner], "constructor: owner not unique");
            isOwner[owner] = true;
            emit Owner(owner, isOwner[owner]);
        }

        chainId = _chainId;
    }

    /// @notice Functions on this contract can only be called by this contract via the `executeTransaction` function
    modifier onlySelf() {
        require(msg.sender == address(this), "Not Self");
        _;
    }

    /**
        @notice Add new transactions signer and set new number of signatures required
        @dev Can only be called by this wallet
        @param newSigner Address of new signer
        @param newSignaturesRequired Number of signatures required
     */
    function addSigner(address newSigner, uint256 newSignaturesRequired) public onlySelf {
        require(newSigner != address(0), "addSigner: zero address");
        require(!isOwner[newSigner], "addSigner: owner not unique");
        require(newSignaturesRequired > 0, "addSigner: must be non-zero sigs required");

        isOwner[newSigner] = true;
        signaturesRequired = newSignaturesRequired;

        emit Owner(newSigner, isOwner[newSigner]);
    }

    /**
        @notice Remove old transactions signer and set new number of signatures required
        @dev Can only be called by this wallet
        @param oldSigner Address of new signer
        @param newSignaturesRequired Number of signatures required
     */
    function removeSigner(address oldSigner, uint256 newSignaturesRequired) public onlySelf {
        require(isOwner[oldSigner], "removeSigner: not owner");
        require(newSignaturesRequired > 0, "removeSigner: must be non-zero sigs required");

        isOwner[oldSigner] = false;
        signaturesRequired = newSignaturesRequired;

        emit Owner(oldSigner, isOwner[oldSigner]);
    }

    /**
        @notice Update number of signatures required
        @dev Can only be called by this wallet
        @param newSignaturesRequired Number of new signatures required
     */
    function updateSignaturesRequired(uint256 newSignaturesRequired) public onlySelf {
        require(newSignaturesRequired > 0, "updateSignaturesRequired: must be non-zero sigs required");

        signaturesRequired = newSignaturesRequired;
    }

    /**
        @notice Executes a transaction is signatures are valid
        @param to Address to send transaction to
        @param value The amount to send with the transaction
        @param data The transaction data
        @param signatures The signatures required to execute the transaction
                            Signatures must be in ascending order to reduce gas cost of duplicate check
        @return Returned value of transaction
     */
    function executeTransaction(address payable to, uint256 value, bytes memory data, bytes[] memory signatures)
        public
        returns (bytes memory)
    {
        require(isOwner[msg.sender], "executeTransaction: only owners can execute");

        bytes32 _hash =  getTransactionHash(nonce, to, value, data);

        nonce++;

        uint256 validSignatures;

        // Prevent duplicate signatures
        address duplicateGuard;
        uint256 signaturesLength = signatures.length;
        for (uint i = 0; i < signaturesLength; i++) {
            // Recover address of signer
            address recovered = recover(_hash, signatures[i]);

            // Ensure signer has not been checked
            require(recovered > duplicateGuard, "executeTransaction: duplicate or unordered signatures");

            duplicateGuard = recovered;

            if(isOwner[recovered]){
              validSignatures++;
            }
        }

        require(validSignatures>=signaturesRequired, "executeTransaction: not enough valid signatures");

        // Send transaction and retrieve returned value(if any) in bytes
        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "executeTransaction: tx failed");

        emit ExecuteTransaction(msg.sender, to, value, data, nonce-1, _hash, result);
        return result;
    }

    /**
        @notice Retrieves the transaction hash
        @param _nonce Transaction nonce
        @param to Address to send transaction to
        @param value The amount to send with the transaction
        @param data The transaction data
        @return Transaction hash
     */
    function getTransactionHash(uint256 _nonce, address to, uint256 value, bytes memory data) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), chainId, _nonce, to, value, data));
    }

    /**
        @notice Recovers transaction signer
        @param _hash Transaction hash
        @param _signature Signer signature
        @return Address of signer
     */
    function recover(bytes32 _hash, bytes memory _signature) public pure returns (address) {
        return _hash.toEthSignedMessageHash().recover(_signature);
    }

    receive() payable external {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    fallback() external payable {}
}
