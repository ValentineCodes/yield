// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../interfaces/AggregatorV3Interface.sol";

import "../interfaces/IYieldOracle.sol";

import "../Errors/Errors.sol";

import {IYEthToken} from "../interfaces/IYEthToken.sol";

import {IOperatorDelegator} from "../interfaces/IOperatorDelegator.sol";

contract YieldOracle is IYieldOracle {
    AggregatorV3Interface immutable i_oracle;

    address immutable i_stETH;

    IYEthToken immutable i_yEth;

    IOperatorDelegator immutable i_operatorDelegator;

    // Scale factor for asset price value
    uint256 constant SCALE_FACTOR = 10 ** 18;

    /// @dev The maxmimum staleness allowed for a price feed from chainlink
    uint256 constant MAX_TIME_WINDOW = 86400 + 60; // 24 hours + 60 seconds

    constructor(
        address oracle,
        address stETH,
        address yEth,
        address operatorDelegator
    ) {
        i_oracle = AggregatorV3Interface(oracle);
        i_stETH = stETH;
        i_yEth = IYEthToken(yEth);
        i_operatorDelegator = IOperatorDelegator(operatorDelegator);
    }

    /// @notice Provides Asset/ETH exchange rate
    /// @return assetPrice exchange rate of asset
    function getAssetPrice() public returns (uint256) {
        (, int256 price, , uint256 timestamp, ) = oracle.latestRoundData();
        if (timestamp < block.timestamp - MAX_TIME_WINDOW)
            revert OraclePriceExpired();
        if (price <= 0) revert InvalidOraclePrice();

        return price;
    }

    /// @notice Determines the amount of yETH token to mint for every stETH deposit using the stETH/ETH conversion rate
    /// @return Amount of yETH to mint
    function calculateMintAmount(
        uint256 amount
    ) external pure returns (uint256) {
        uint256 yETHTotalSupply = i_yEth.totalSupply();
        uint256 stETHTVL = i_operatorDelegator.getTokenBalanceFromStrategy();

        // For first mint, just return the new value added.
        if (yETHTotalSupply == 0 || stETHTVL == 0) {
            return amount;
        }

        return (amount * yETHTotalSupply) / stETHTVL;
    }
}
