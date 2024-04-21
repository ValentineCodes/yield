// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IStrategy} from "./IStrategy.sol";

interface IOperatorDelegator {
    event WithdrawQueued(
        bytes32 withdrawRoot,
        address staker,
        address delegatedTo,
        address withdrawer,
        uint nonce,
        uint startBlock,
        IStrategy[] strategies,
        uint256[] shares
    );

    /// @dev Gets the underlying token amount from the amount of shares
    function getTokenBalanceFromStrategy() public view returns (uint256);

    /// @dev Deposit tokens into the EigenLayer.  This call assumes any balance of tokens in this contract will be delegated
    /// so do not directly send tokens here or they will be delegated and attributed to the next caller.
    /// @return shares The amount of new shares in the `strategy` created as part of the action.
    function deposit(uint256 amount) external returns (uint256 shares);

    /**
     * @notice Undelegates the operator of this contract
     * @dev Only the operator delegator admin can call this
     * @return Returns the withdrawal root
     */
    function undelegate() external returns (bytes32[] memory withdrawalRoot);

    /// @dev Gets the index of the strategy in EigenLayer in the staker's strategy list
    function getStrategyIndex() public view returns (uint256);

    /**
     * @notice Queues withdrawal on EigenLayer
     * @dev Only the operator delegator admin can call this
     * @return The withdrawal root
     */
    function queueWithdrawal() external returns (bytes32);

    /**
     * @notice Completes withdrawal on EigenLayer
     * @dev Only the operator delegator admin can call this
     * @param withdrawal The withdrawal params
     * @param middlewareTimesIndex
     */
    function completeWithdrawal(
        IStrategyManager.QueuedWithdrawal calldata withdrawal,
        uint256 middlewareTimesIndex
    ) external;

    /// @dev Transfer stETH token to staker
    function transferTokenToStaker(address staker, uint256 amount) external;
}
