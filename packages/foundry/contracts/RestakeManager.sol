// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Initializer} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IRestakeManager} from "./interfaces/IRestakeManager.sol";
import {IYEthToken} from "./interfaces/IYEthToken.sol";
import {IOperatorDelegator} from "./interfaces/IOperatorDelegator.sol";
import "./Errors.sol";

/**
 * @author  Yield
 * @title   RestakeManager
 * @dev     This contract is the main entrypoint for external users into the protocol
            Users will interact with this contract to deposit and withdraw value into and from EigenLayer
            Ownership of deposited funds will be tracked via the ezETh token
 */
contract RestakeManager is
    IRestakeManager,
    Initializable,
    ReentrancyGuard,
    Context
{
    using SafeERC20 for IERC20;

    /// @dev the yETH token contract
    IYEthToken immutable i_yEth;

    /// @dev the operator delegator contract
    IOperatorDelegator immutable i_operatorDelegator;

    /// @dev address of the stETH token
    address immutable i_stETH;

    constructor() {
        _disableInitializers();
    }

    /// @dev Initializes the contract with initial vars
    function initialize(
        address stETH,
        address yEth,
        address operatorDelegator
    ) external initializer {
        i_stETH = stETH;
        i_yEth = IYEthToken(yEth);
        i_operatorDelegator = IOperatorDelegator(operatorDelegator);
    }

    /**
     * @notice Deposit stETH into the protocol
     * @param amount Amount of stETH to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        // checks
        if (amount == 0) revert InvalidDepositAmount();

        // amount to mint taking into consideration the total stETH in the system and their appreciation over time based on staking rewards.
        uint256 yETHAmountToMint = getMintAmount(amount);

        // transfer stETH to this contract
        if (
            !IERC20(i_stETH).transferFrom(_msgSender(), address(this), amount)
        ) {
            revert TransferFailed();
        }

        // Transfer the collateral token to this address
        IERC20(i_stETH).safeTransferFrom(_msgSender(), address(this), amount);

        // Approve the tokens to the operator delegator
        IERC20(i_stETH).safeApprove(address(i_operatorDelegator), amount);

        // Call deposit on the operator delegator
        i_operatorDelegator.deposit(amount);

        // mint yETH to user
        i_yEth.mint(_msgSender(), yETHAmountToMint);

        emit Deposit(_msgSender(), amount, yETHAmountToMint);
    }

    /**
     * @notice Withdraw stETH from the protocol
     * @param amount Amount of yETH tokens to burn
     */
    function withdraw(uint256 amount) external {
        if (amount == 0) revert InvalidZeroInput();

        // Ensure staker has enough balance
        if (amount > i_yEth.balanceOf(_msgSender())) revert InsufficientFunds();

        // Determine amount of stETH tokens to withdraw
        uint256 withdrawAmount = getWithdrawAmount(amount);

        // Burn yETH tokens
        i_yEth.burn(amount);

        // Transfer stETH token to staker
        i_operatorDelegator.transferTokenToStaker(_msgSender(), withdrawAmount);

        emit Withdraw(withdrawAmount, amount);
    }

    /// @notice Determines the amount of yETH tokens to mint for every stETH deposit using the stETH/ETH conversion rate
    /// @return Amount of yETH tokens to mint
    function getMintAmount(uint256 amount) public view returns (uint256) {
        uint256 yETHTotalSupply = i_yEth.totalSupply();
        uint256 stETHTVL = i_operatorDelegator.getTokenBalanceFromStrategy();

        // For first mint, just return the new value added.
        if (yETHTotalSupply == 0 || stETHTVL == 0) {
            return amount;
        }

        return (amount * yETHTotalSupply) / stETHTVL;
    }

    /// @notice Determines the amount of stETH tokens to withdraw
    /// @return Amount of stETH tokens to withdraw
    function getWithdrawAmount(uint256 amount) public view returns (uint256) {
        uint256 yETHTotalSupply = yEth.totalSupply();
        uint256 stETHTVL = address(i_operatorDelegator).balance;

        if (stETHTVL == 0) revert NoWithdrawnFunds();

        return (amount * stETHTVL) / yETHTotalSupply;
    }
}
