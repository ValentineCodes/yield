// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IRoleManager} from "./interfaces/IRoleManager.sol";

import {IStrategyManager} from "./interfaces/IStrategyManager.sol";

import {IRestakeManager} from "./interfaces/IRestakeManager.sol";

import {IOperatorDelegator} from "./interfaces/IOperatorDelegator.sol";

import {IDelegationManager} from "./interfaces/IDelegationManager.sol";

import {Context} from "@openzeppelin/contracts/utils/Context.sol";

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IStrategy} from "./interfaces/IStrategy.sol";

import {ISignatureUtils} from "./interfaces/ISignatureUtils.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./Errors.sol";

/**
 * @dev This contract will be responsible for interacting with Eigenlayer
 * This contract will be delegated to an operator on deployment
 * This contract handled all stETH tokens, all of which will be delegated to an operator
 * Only the RestakeManager should be interacting with this contract for EL interactions.
 */
contract OperatorDelegator is IOperatorDelegator, ReentrancyGuard, Context {
    using SafeERC20 for IERC20;

    /// @dev reference to the RoleManager contract
    IRoleManager private immutable roleManager;

    /// @dev The main strategy manager contract in EigenLayer
    IStrategyManager private immutable strategyManager;

    /// @dev the restake manager contract
    IRestakeManager private immutable restakeManager;

    /// @dev the delegation manager contract
    IDelegationManager private immutable delegationManager;

    /// @dev the strategy contract for stETH
    IStrategy private immutable strategy;

    /// @dev the yETH token contract
    IYEthToken private immutable yEth;

    /// @dev address of the stETH token
    address immutable i_stETH;

    /// @dev address of the operator that manages deposits on EigenLayer
    address immutable i_operator;

    /// @dev Allows only a whitelisted address to configure the contract
    modifier onlyOperatorDelegatorAdmin() {
        if (!roleManager.isOperatorDelegatorAdmin(_msgSender()))
            revert NotOperatorDelegatorAdmin();
        _;
    }

    /// @dev Allows only the RestakeManager address to call functions
    modifier onlyRestakeManager() {
        if (_msgSender() != address(restakeManager)) revert NotRestakeManager();
        _;
    }

    constructor(
        IRoleManager _roleManager,
        IStrategyManager _strategyManager,
        IRestakeManager _restakeManager,
        IDelegationManager _delegationManager,
        IYEthToken _yEth,
        address operator,
        address stETH,
        address _strategy,
    ) {
        if (address(_roleManager) == address(0x0)) revert ZeroAddress();
        if (address(_strategyManager) == address(0x0)) revert ZeroAddress();
        if (address(_restakeManager) == address(0x0)) revert ZeroAddress();
        if (address(_delegationManager) == address(0x0)) revert ZeroAddress();
        if (address(_yEth) == address(0x0)) revert ZeroAddress();
        if (operator == address(0x0)) revert ZeroAddress();

        roleManager = _roleManager;
        strategyManager = _strategyManager;
        restakeManager = _restakeManager;
        delegationManager = _delegationManager;

        // Delegate this contract to an operator
        _delegationManager.delegateTo(
            operator,
            ISignatureUtils.SignatureWithExpiry(bytes(0), 0),
            bytes32(0)
        );

        i_operator = operator;
        i_stETH = stETH;
        strategy = _strategy;
    }

    /// @dev Gets the underlying token amount from the amount of shares
    function getTokenBalanceFromStrategy() public view returns (uint256) {
        return strategy.userUnderlyingView(address(this));
    }

    /// @dev Deposit tokens into the EigenLayer.  This call assumes any balance of tokens in this contract will be delegated
    /// so do not directly send tokens here or they will be delegated and attributed to the next caller.
    /// @return shares The amount of new shares in the `strategy` created as part of the action.
    function deposit(
        uint256 amount
    ) external nonReentrant onlyRestakeManager returns (uint256 shares) {
        if (address(strategy) == address(0x0)) revert ZeroAddress();

        // Move the tokens into this contract
        IERC20(i_stETH).safeTransferFrom(_msgSender(), address(this), amount);

        // Approve the strategy manager to spend the tokens
        IERC20(i_stETH).safeApprove(address(strategyManager), amount);

        // Deposit the tokens via the strategy manager
        return
            strategyManager.depositIntoStrategy(
                strategy,
                IERC20(i_stETH),
                amount
            );
    }

    /**
     * @notice Undelegates the operator of this contract 
     * @dev Only the operator delegator admin can call this
     * @return Returns the withdrawal root
     */
    function undelegate()
        external
        onlyOperatorDelegatorAdmin
        returns (bytes32[] memory withdrawalRoot)
    {
        return delegationManager.undelegate(address(this));
    }

    /// @dev Gets the index of the strategy in EigenLayer in the staker's strategy list
    function getStrategyIndex() public view returns (uint256) {
        // Get the length of the strategy list for this contract
        uint256 strategyLength = strategyManager.stakerStrategyListLength(
            address(this)
        );

        for (uint256 i = 0; i < strategyLength; i++) {
            if (
                strategyManager.stakerStrategyList(address(this), i) ==
                strategy
            ) {
                return i;
            }
        }

        // Not found
        revert NotFound();
    }

    /**
     * @notice Queues withdrawal on EigenLayer
     * @dev Only the operator delegator admin can call this
     * @return The withdrawal root
     */
    function queueWithdrawal()
        external
        onlyOperatorDelegatorAdmin
        returns (bytes32)
    {
        if (address(strategy) == address(0x0)) revert ZeroAddress();

        // retrieve the total shares of this contract on EigenLayer
        uint256 shares = strategy.shares(address(this));

        // queue withdrawals on EigenLayer
        bytes32 withdrawalRoot = delegationManager.queueWithdrawals(
            [
                IDelegationManager.QueuedWithdrawalParams(
                    [strategy],
                    [shares],
                    address(this)
                )
            ]
        );

        emit WithdrawQueued(
            withdrawalRoot,
            address(this),
            i_operator,
            address(this),
            1,
            block.number,
            [strategy],
            [shares]
        );

        return withdrawalRoot;
    }

    /**
     * @notice Completes withdrawal on EigenLayer
     * @dev Only the operator delegator admin can call this
     * @param withdrawal The withdrawal params
     * @param middlewareTimesIndex
     */
    function completeWithdrawal(
        IStrategyManager.QueuedWithdrawal calldata withdrawal,
        uint256 middlewareTimesIndex
    ) external nonReentrant onlyOperatorDelegatorAdmin {
        delegationManager.completeQueuedWithdrawal(
            withdrawal,
            [IERC20(i_stETH)],
            middlewareTimesIndex,
            true // Always get tokens and not share transfers
        );
    }

    /// @dev Transfer stETH token to staker
    function transferTokenToStaker(address staker, uint256 amount) external onlyRestakeManager {
        IERC20(i_stETH).safeTransfer(staker, amount);
    }
}
