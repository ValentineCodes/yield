// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "../Permissions/IRoleManager.sol";

/// @title YEthTokenStorage
/// @dev This contract will hold all local variables for the  Contract
/// When upgrading the protocol, inherit from this contract on the V2 version and change the
/// StorageManager to inherit from the later version.  This ensures there are no storage layout
/// corruptions when upgrading.
contract YEthTokenStorageV1 {
    /// @dev reference to the RoleManager contract
    IRoleManager public s_roleManager;

    /// @dev flag to control whether transfers are paused
    bool public s_paused;
}