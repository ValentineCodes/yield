// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IRoleManager {
    /// @dev Determines if the specified address has permissions to manage RoleManager
    /// @param potentialAddress Address to check
    function isRoleManagerAdmin(
        address potentialAddress
    ) external view returns (bool);

    /// @dev Determines if the specified address has permission to mint or burn yETH tokens
    /// @param potentialAddress Address to check
    function isYETHMinterBurner(
        address potentialAddress
    ) external view returns (bool);

    /// @dev Determines if the specified address has permission to update config on the OperatorDelgator Contracts
    /// @param potentialAddress Address to check
    function isOperatorDelegatorAdmin(
        address potentialAddress
    ) external view returns (bool);

    /// @dev Determines if the specified address has permission to update config on the Restake Manager
    /// @param potentialAddress Address to check
    function isRestakeManagerAdmin(
        address potentialAddress
    ) external view returns (bool);

    /// @dev Determines if the specified address has permission to update config on the Token Contract
    /// @param potentialAddress Address to check
    function isTokenAdmin(
        address potentialAddress
    ) external view returns (bool);

    /// @dev Determines if the specified address has permission to pause deposits and withdraws
    /// @param potentialAddress Address to check
    function isDepositWithdrawPauser(
        address potentialAddress
    ) external view returns (bool);
}
