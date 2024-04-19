// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Errors/Errors.sol";

import {IRoleManager} from "./interfaces/IRoleManager.sol";

import {IStrategyManager} from "./interfaces/IStrategyManager.sol";

import {IRestakeManager} from "./interfaces/IRestakeManager.sol";

import {IOperatorDelegator} from "./interfaces/IOperatorDelegator.sol";

import {Context} from "@openzeppelin/contracts/utils/Context.sol";

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IStrategy} from "./interfaces/IStrategy.sol";

contract OperatorDelegator is IOperatorDelegator, Context {
    using SafeERC20 for IERC20;

    /// @dev reference to the RoleManager contract
    IRoleManager public roleManager;

    /// @dev The main strategy manager contract in EigenLayer
    IStrategyManager public strategyManager;

    /// @dev the restake manager contract
    IRestakeManager public restakeManager;

    /// @dev the delegation manager contract
    // IDelegationManager public delegationManager;

    /// @dev The mapping of supported token addresses to their respective strategy addresses
    /// This will control which tokens are supported by the protocol
    mapping(IERC20 => IStrategy) public tokenStrategyMapping;

    /// @dev The address to delegate tokens to in EigenLayer
    address public delegateAddress;

    address constant STETH = 0x0;

    /// @dev Allows only a whitelisted address to configure the contract
    modifier onlyOperatorDelegatorAdmin() {
        if (!roleManager.isOperatorDelegatorAdmin(_msgSender()))
            revert NotOperatorDelegatorAdmin();
        _;
    }

    /// @dev Allows only the RestakeManager address to call functions
    modifier onlyRestakeManager() {
        if (_msgSender() != address(restakeManager))
            revert NotRestakeManager();
        _;
    }

    constructor(
        IRoleManager _roleManager,
        IStrategyManager _strategyManager,
        IRestakeManager _restakeManager,
        // IDelegationManager delegationManager
    ) {
        if (address(_roleManager) == address(0x0)) revert InvalidZeroInput();
        if (address(_strategyManager) == address(0x0)) revert InvalidZeroInput();
        if (address(_restakeManager) == address(0x0)) revert InvalidZeroInput();
        // if (address(delegationManager) == address(0x0))
        //     revert InvalidZeroInput();

        roleManager = _roleManager;
        strategyManager = _strategyManager;
        restakeManager = _restakeManager;
        // s_delegationManager = delegationManager;
    }

    /// @dev Gets the underlying token amount from the amount of shares
    function getTokenBalanceFromStrategy() external view returns (uint256) {
        return IStrategy(STETH).userUnderlyingView(address(this));
    }

    /// @dev Deposit tokens into the EigenLayer.  This call assumes any balance of tokens in this contract will be delegated
    /// so do not directly send tokens here or they will be delegated and attributed to the next caller.
    /// @return shares The amount of new shares in the `strategy` created as part of the action.
    function deposit(
        uint256 amount
    ) external nonReentrant onlyRestakeManager returns (uint256 shares) {
        if (amount == 0) revert InvalidZeroInput();

        // Move the tokens into this contract
        IERC20(STETH).safeTransferFrom(msg.sender, address(this), amount);

        // Approve the strategy manager to spend the tokens
        IERC20(STETH).safeApprove(address(strategyManager), amount);

        // Deposit the tokens via the strategy manager
        return
            strategyManager.depositIntoStrategy(tokenStrategyMapping[_token], STETH, amount);
    }
}
