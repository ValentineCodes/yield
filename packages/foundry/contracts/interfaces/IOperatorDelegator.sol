// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IOperatorDelegator {
    /// @dev Gets the underlying token amount from the amount of shares
    function getTokenBalanceFromStrategy() external view returns (uint256);

    /// @dev Deposit tokens into the EigenLayer.  This call assumes any balance of tokens in this contract will be delegated
    /// so do not directly send tokens here or they will be delegated and attributed to the next caller.
    /// @return shares The amount of new shares in the `strategy` created as part of the action.
    function deposit(uint256 amount) external returns (uint256 shares);
}
