// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Errors.sol";

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

    /// @dev the strategy for stETH
    IStrategy private immutable stETHStrategy;

    IYEthToken private immutable yEth;

    address immutable i_stETH;

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
        address _stETHStrategy,
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

        // Delegate this operatorDelegator to an operator
        _delegationManager.delegateTo(
            operator,
            ISignatureUtils.SignatureWithExpiry(bytes(0), 0),
            bytes32(0)
        );

        i_operator = operator;
        i_stETH = stETH;
        stETHStrategy = _stETHStrategy;
    }

    /// @dev Gets the underlying token amount from the amount of shares
    function getTokenBalanceFromStrategy() public view returns (uint256) {
        return stETHStrategy.userUnderlyingView(address(this));
    }

    /// @dev Deposit tokens into the EigenLayer.  This call assumes any balance of tokens in this contract will be delegated
    /// so do not directly send tokens here or they will be delegated and attributed to the next caller.
    /// @return shares The amount of new shares in the `strategy` created as part of the action.
    function deposit(
        uint256 amount
    ) external nonReentrant onlyRestakeManager returns (uint256 shares) {
        if (address(stETHStrategy) == address(0x0)) revert ZeroAddress();

        // Move the tokens into this contract
        IERC20(i_stETH).safeTransferFrom(_msgSender(), address(this), amount);

        // Approve the strategy manager to spend the tokens
        IERC20(i_stETH).safeApprove(address(strategyManager), amount);

        // Deposit the tokens via the strategy manager
        return
            strategyManager.depositIntoStrategy(
                stETHStrategy,
                IERC20(i_stETH),
                amount
            );
    }

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
                stETHStrategy
            ) {
                return i;
            }
        }

        // Not found
        revert NotFound();
    }

    function queueWithdrawal()
        external
        onlyOperatorDelegatorAdmin
        returns (bytes32)
    {
        if (address(stETHStrategy) == address(0x0)) revert ZeroAddress();

        uint256 shares = stETHStrategy.shares(address(this));

        bytes32 withdrawalRoot = delegationManager.queueWithdrawals(
            [
                IDelegationManager.QueuedWithdrawalParams(
                    [stETHStrategy],
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
            [stETHStrategy],
            [shares]
        );

        return withdrawalRoot;
    }

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

    function withdraw(uint256 amount) external nonReentrant {
        if(amount == 0) revert InvalidZeroInput();
        if(amount > yETH.balanceOf(_msgSender())) revert InsufficientFunds();

        uint256 withdrawAmount = getWithdrawAmount(amount);

        yETH.burn(amount);

        IERC20(i_stETH).safeTransfer(_msgSender(), withdrawAmount);

        emit Withdraw(withdrawAmount, amount);
    }

    function getWithdrawAmount(uint256 amount) public view returns (uint256) {
        uint256 yETHTotalSupply = yEth.totalSupply();

        if(address(this).balance == 0) revert NoWithdrawnFunds();

        return (amount * address(this).balance) / yETHTotalSupply;
    }
}
