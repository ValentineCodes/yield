// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IYieldOracle {
    /// @notice Provides stETH/ETH exchange rate
    /// @return assetPrice exchange rate of asset
    function getAssetPrice() public returns (uint256);

    /// @notice Determines the amount of yETH token to mint for every stETH deposit using the stETH/ETH conversion rate
    /// @param amount Amount of stETH deposited
    /// @return Amount of yETH to mint
    function calculateMintAmount(
        uint256 amount
    ) external pure returns (uint256);
}
