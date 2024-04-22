// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IRoleManager.sol";
import "./Errors.sol";

/// @title RoleManager
/// @dev This contract will track the roles and permissions in the protocol
/// Note: This contract is protected via a permissioned account set via the initializer.  Caution should
/// be used as the owner could renounce the role leaving all future actions disabled.  Additionally,
/// if a malicious account was able to obtain the role, they could use it to grant permissions to malicious accounts.
contract RoleManager is IRoleManager, AccessControl {
    /// @dev role for granting capability to mint/burn yETH
    bytes32 public constant RX_ETH_MINTER_BURNER =
        keccak256("RX_ETH_MINTER_BURNER");

    /// @dev role for granting capability to update config on the OperatorDelgator Contracts
    bytes32 public constant OPERATOR_DELEGATOR_ADMIN =
        keccak256("OPERATOR_DELEGATOR_ADMIN");

    /// @dev role for granting capability to update config on the Restake Manager
    bytes32 public constant RESTAKE_MANAGER_ADMIN =
        keccak256("RESTAKE_MANAGER_ADMIN");

    /// @dev role for granting capability to update config on the Token Contract
    bytes32 public constant TOKEN_ADMIN = keccak256("TOKEN_ADMIN");

    /// @dev role for pausing deposits and withdraws on RestakeManager
    bytes32 public constant DEPOSIT_WITHDRAW_PAUSER =
        keccak256("DEPOSIT_WITHDRAW_PAUSER");

    constructor(address roleManagerAdmin) {
        if (address(roleManagerAdmin) == address(0x0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, roleManagerAdmin);
    }

    /// @dev Determines if the specified address has permissions to manage RoleManager
    /// @param potentialAddress Address to check
    function isRoleManagerAdmin(
        address potentialAddress
    ) external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, potentialAddress);
    }

    /// @dev Determines if the specified address has permission to mint or burn yETH tokens
    /// @param potentialAddress Address to check
    function isYETHMinterBurner(
        address potentialAddress
    ) external view returns (bool) {
        return hasRole(RX_ETH_MINTER_BURNER, potentialAddress);
    }

    /// @dev Determines if the specified address has permission to update config on the OperatorDelgator Contracts
    /// @param potentialAddress Address to check
    function isOperatorDelegatorAdmin(
        address potentialAddress
    ) external view returns (bool) {
        return hasRole(OPERATOR_DELEGATOR_ADMIN, potentialAddress);
    }

    /// @dev Determines if the specified address has permission to update config on the RestakeManager Contract config
    /// @param potentialAddress Address to check
    function isRestakeManagerAdmin(
        address potentialAddress
    ) external view returns (bool) {
        return hasRole(RESTAKE_MANAGER_ADMIN, potentialAddress);
    }

    /// @dev Determines if the specified address has permission to update config on the Token Contract
    /// @param potentialAddress Address to check
    function isTokenAdmin(
        address potentialAddress
    ) external view returns (bool) {
        return hasRole(TOKEN_ADMIN, potentialAddress);
    }

    /// @dev Determines if the specified address has permission to pause deposits and withdraws
    /// @param potentialAddress Address to check
    function isDepositWithdrawPauser(
        address potentialAddress
    ) external view returns (bool) {
        return hasRole(DEPOSIT_WITHDRAW_PAUSER, potentialAddress);
    }
}
