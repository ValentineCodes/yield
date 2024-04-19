// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IYieldOracle} from "./interfaces/IYieldOracle.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Context} from "@openzeppelin/contracts/utils/Context.sol";

import {IRestakeManager} from "./interfaces/IRestakeManager.sol";

import {IYEthToken} from "./interfaces/IYEthToken.sol";

import "./Errors/Errors.sol";

contract RestakeManager is IRestakeManager, ReentrancyGuard, Context {
    IYieldOracle immutable i_oracle;

    IYEthToken immutable i_yEth;

    address immutable i_stETH;

    constructor(address oracle, address stETH, address yEth) {
        i_oracle = IYieldOracle(oracle);
        i_stETH = stETH;
        i_yEth = IYEthToken(yEth);
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

        // mint yETH to user
        i_yEth.mint(_msgSender(), yETHAmountToMint);

        emit Deposit(_msgSender(), amount, yETHAmountToMint);
    }
}
