// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IRestakeManager {
    event Deposit(
        address indexed depositor,
        uint256 indexed depositAmount,
        uint256 indexed yETHMintAmount
    );
}
