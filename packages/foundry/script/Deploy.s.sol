//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/SafeMultiSigWallet.sol";
import "./DeployHelpers.s.sol";

contract DeployScript is ScaffoldETHDeploy {
    error InvalidPrivateKey(string);

    function run() external {
        uint256 deployerPrivateKey = setupLocalhostEnv();
        if (deployerPrivateKey == 0) {
            revert InvalidPrivateKey(
                "You don't have a deployer account. Make sure you have set DEPLOYER_PRIVATE_KEY in .env or use `yarn generate` to generate a new random account"
            );
        }
        vm.startBroadcast(deployerPrivateKey);


        address[] memory signers = new address[](1);
        signers[0] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

        SafeMultiSigWallet safeMultiSigWallet = new SafeMultiSigWallet(31337, signers, 1);
        console.logString(
            string.concat(
                "SafeMultiSigWallet deployed at: ",
                vm.toString(address(safeMultiSigWallet))
            )
        );
        vm.stopBroadcast();

        /**
         * This function generates the file containing the contracts Abi definitions.
         * These definitions are used to derive the types needed in the custom scaffold-eth hooks, for example.
         * This function should be called last.
         */
        exportDeployments();
    }

    function test() public {}
}
