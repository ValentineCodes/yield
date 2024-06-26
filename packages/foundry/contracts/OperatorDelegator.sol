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
import {IYEthToken} from "./interfaces/IYEthToken.sol";
import "./Errors.sol";

/**
 * @dev This contract will be responsible for interacting with Eigenlayer
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

    /// @dev address of the stETH token
    address immutable i_stETH;

    /// @dev address of the operator that manages deposits on EigenLayer
    address private s_operator;

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
        IStrategy _strategy,
        address stETH
    ) {
        if (address(_roleManager) == address(0x0)) revert ZeroAddress();
        if (address(_strategyManager) == address(0x0)) revert ZeroAddress();
        if (address(_restakeManager) == address(0x0)) revert ZeroAddress();
        if (address(_delegationManager) == address(0x0)) revert ZeroAddress();

        roleManager = _roleManager;
        strategyManager = _strategyManager;
        restakeManager = _restakeManager;
        delegationManager = _delegationManager;
        strategy = _strategy;
        i_stETH = stETH;
    }

    /// @dev Deposit tokens into the EigenLayer.  This call assumes any balance of tokens in this contract will be delegated
    /// so do not directly send tokens here or they will be delegated and attributed to the next caller.
    /// @return shares The amount of new shares in the `strategy` created as part of the action.
    function deposit(
        uint256 amount
    ) external onlyRestakeManager returns (uint256 shares) {
        if (address(strategy) == address(0x0)) revert ZeroAddress();
        if(s_operator == address(0x0)) revert NoOperator();

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
        @notice Delegates to an operator
        @dev Only the operator delegator admin can call this
        @param operator Address of operator
     */
    function delegate(address operator) external onlyOperatorDelegatorAdmin {
        if (operator == address(0x0)) revert ZeroAddress();

        address _operator = s_operator;
        if(_operator != address(0x0) || _operator == operator) revert AlreadyDelegated();

        // Delegate this contract to an operator
        delegationManager.delegateTo(
            operator,
            ISignatureUtils.SignatureWithExpiry(bytes(""), 0),
            bytes32("")
        );

        s_operator = operator;
    }

    /**
     * @notice Undelegates the operator of this contract
     * @dev Only the operator delegator admin can call this
     * @return withdrawalRoot Returns the withdrawal root
     */
    function undelegate()
        external
        onlyOperatorDelegatorAdmin
        returns (bytes32[] memory withdrawalRoot)
    {
         withdrawalRoot = delegationManager.undelegate(address(this));

         delete s_operator;
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

        uint256 nonce = delegationManager.cumulativeWithdrawalsQueued(address(this));

        IStrategy[] memory strategiesToWithdraw = new IStrategy[](1);
        strategiesToWithdraw[0] = strategy;

        // retrieve the total shares of this contract on EigenLayer
        uint256[] memory amountsToWithdraw = new uint256[](1);
        amountsToWithdraw[0] = strategy.shares(address(this));

        if(amountsToWithdraw[0] == 0) revert NoDeposits();

        IDelegationManager.QueuedWithdrawalParams[] memory queuedWithdrawalParams = new IDelegationManager.QueuedWithdrawalParams[](1);
        queuedWithdrawalParams[0] = IDelegationManager.QueuedWithdrawalParams(
                    strategiesToWithdraw,
                    amountsToWithdraw,
                    address(this)
                );

        // queue withdrawals on EigenLayer
        bytes32[] memory withdrawalRoots = delegationManager.queueWithdrawals(queuedWithdrawalParams);

        emit WithdrawQueued(
            withdrawalRoots[0],
            address(this),
            s_operator,
            address(this),
            nonce,
            block.number,
            strategiesToWithdraw,
            amountsToWithdraw
        );

        return withdrawalRoots[0];
    }

    /**
     * @notice Completes withdrawal on EigenLayer
     * @dev Only the operator delegator admin can call this
     * @param withdrawal The withdrawal params
     */
    function completeWithdrawal(
        IDelegationManager.Withdrawal calldata withdrawal
    ) external nonReentrant onlyOperatorDelegatorAdmin {
        IERC20[] memory tokens = new IERC20[](1);
        tokens[0] = IERC20(i_stETH);

        delegationManager.completeQueuedWithdrawal(
            withdrawal,
            tokens,
            0,
            true // Always get tokens and not share transfers
        );

        emit WithdrawalComplete(withdrawal);
    }

    /// @dev Transfer stETH token to staker
    function transferTokenToStaker(
        address staker,
        uint256 amount
    ) external onlyRestakeManager {
        IERC20(i_stETH).safeTransfer(staker, amount);
    }

    /// @dev Gets operator
    function getOperator() external view returns (address) {
        return s_operator;
    }

    /// @dev Gets the index of the strategy in EigenLayer in the staker's strategy list
    function getStrategyIndex() public view returns (uint256) {
        // Get the length of the strategy list for this contract
        uint256 strategyLength = strategyManager.stakerStrategyListLength(
            address(this)
        );

        for (uint256 i = 0; i < strategyLength; i++) {
            if (
                strategyManager.stakerStrategyList(address(this))[i] == strategy
            ) {
                return i;
            }
        }

        // Not found
        revert NotFound();
    }

    /// @dev Gets the underlying token amount from the amount of shares
    function getTokenBalanceFromStrategy() public view returns (uint256) {
        return strategy.userUnderlyingView(address(this));
    }
}
