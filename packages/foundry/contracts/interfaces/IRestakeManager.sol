// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IRestakeManager {
    event Deposit(
        address indexed depositor,
        uint256 indexed depositAmount,
        uint256 indexed yETHMintAmount
    );

    event Withdraw(uint256 amountWithdraw, uint256 amountBurned);

    /**
     * @notice Deposit stETH into the protocol
     * @param amount Amount of stETH to deposit
     */
    function deposit(uint256 amount) external;

    /**
     * @notice Withdraw stETH from the protocol
     * @param amount Amount of yETH tokens to burn
     */
    function withdraw(uint256 amount) external;

    /**
     * @notice Determines the amount of yETH tokens to mint for every stETH deposit using the stETH/ETH conversion rate
     * @return Amount of yETH tokens to mint
     */
    function getMintAmount(uint256 amount) public view returns (uint256);

    /**
     * @notice Determines the amount of stETH tokens to withdraw
     * @return Amount of stETH tokens to withdraw
     */
    function getWithdrawAmount(uint256 amount) public view returns (uint256);
}
