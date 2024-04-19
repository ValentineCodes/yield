// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../interfaces/AggregatorV3Interface.sol";

import "../interfaces/IYieldOracle.sol";

import "../Errors/Errors.sol";

contract YieldOracle is IYieldOracle {
    AggregatorV3Interface immutable i_oracle;

    address immutable i_stETH;

    // Scale factor for asset price value
    uint256 constant SCALE_FACTOR = 10 ** 18;

    /// @dev The maxmimum staleness allowed for a price feed from chainlink
    uint256 constant MAX_TIME_WINDOW = 86400 + 60; // 24 hours + 60 seconds

    constructor(address oracle, address stETH) {
        i_oracle = AggregatorV3Interface(oracle);
        i_stETH = stETH;
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
        return (amount * getAssetPrice()) / SCALE_FACTOR;
    }
}
