// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IYieldOracle} from "./interfaces/IYieldOracle.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Context} from "@openzeppelin/contracts/utils/Context.sol";

import {IRestakeManager} from "./interfaces/IRestakeManager.sol";

import {IYEthToken} from "./interfaces/IYEthToken.sol";

import {IOperatorDelegator} from "./interfaces/IOperatorDelegator.sol";

import "./Errors/Errors.sol";

contract RestakeManager is IRestakeManager, ReentrancyGuard, Context {
    using SafeERC20 for IERC20;

    IYieldOracle immutable i_oracle;

    IYEthToken immutable i_yEth;

    IOperatorDelegator immutable i_operatorDelegator;

    address immutable i_stETH;

    constructor(
        address oracle,
        address stETH,
        address yEth,
        address operatorDelegator
    ) {
        i_oracle = IYieldOracle(oracle);
        i_stETH = stETH;
        i_yEth = IYEthToken(yEth);
        i_operatorDelegator = IOperatorDelegator(operatorDelegator);
    }

    function deposit(uint256 amount) external nonReentrant {
        // checks
        if (amount == 0) revert InvalidDepositAmount();

        // amount to mint taking into consideration the total stETH in the system and their appreciation over time based on staking rewards.
        uint256 yETHAmountToMint = i_oracle.calculateMintAmount(amount);

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
}
