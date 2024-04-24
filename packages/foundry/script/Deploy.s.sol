//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {SafeMultiSigWallet} from "../contracts/SafeMultiSigWallet.sol";
import {RestakeManager} from "../contracts/RestakeManager.sol";
import {OperatorDelegator} from "../contracts/OperatorDelegator.sol";
import {RoleManager} from "../contracts/RoleManager.sol";
import {YEthToken} from "../contracts/YEthToken.sol";
import {IStrategy} from "../contracts/interfaces/IStrategy.sol";
import {IStrategyManager} from "../contracts/interfaces/IStrategyManager.sol";
import {IDelegationManager} from "../contracts/interfaces/IDelegationManager.sol";
import "./DeployHelpers.s.sol";

contract DeployScript is ScaffoldETHDeploy {
    error InvalidPrivateKey(string);

    address STRATEGY_MANAGER = 0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6;
    address DELEGATION_MANAGER = 0xA44151489861Fe9e3055d95adC98FbD462B948e7;
    address STETH_STRATEGY = 0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3;
    address OPERATOR = 0xf882cc8107996f15C272080E54fc1Eb036772530;
    address STETH = 0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034;

    function run() external {
        uint256 deployerPrivateKey = setupLocalhostEnv();
        if (deployerPrivateKey == 0) {
            revert InvalidPrivateKey(
                "You don't have a deployer account. Make sure you have set DEPLOYER_PRIVATE_KEY in .env or use `yarn generate` to generate a new random account"
            );
        }
        vm.startBroadcast(deployerPrivateKey);

        // deploy SafeMultiSigWallet
        address[] memory signers = new address[](1);
        signers[0] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

        SafeMultiSigWallet safeMultiSigWallet = new SafeMultiSigWallet(31337, signers, 1);

        // deploy RestakeManager
        RestakeManager restakeManager = new RestakeManager();

        // deploy RoleManager with SafeMultiSigWallet as admin
        RoleManager roleManager = new RoleManager(address(safeMultiSigWallet), address(restakeManager));

        // deploy YEthToken
        YEthToken yETH = new YEthToken(roleManager);

        // DelegationManager instance
        IDelegationManager delegationManager = IDelegationManager(DELEGATION_MANAGER);

        // deploy OperatorDelegator and delegate to an operator
        OperatorDelegator operatorDelegator = new OperatorDelegator(
            roleManager,
            IStrategyManager(STRATEGY_MANAGER),
            restakeManager,
            delegationManager,
            IStrategy(STETH_STRATEGY),
            OPERATOR,
            STETH
        );

        // Initialize contract
        restakeManager.initialize(
            STETH, 
            address(yETH), 
            address(operatorDelegator)
        );

        console.logString(
            string.concat(
                "SafeMultiSigWallet deployed at: ",
                vm.toString(address(safeMultiSigWallet))
            )
        );

        console.logString(
            string.concat(
                "RestakeManager deployed at: ",
                vm.toString(address(restakeManager))
            )
        );

        console.logString(
            string.concat(
                "RoleManager deployed at: ",
                vm.toString(address(roleManager))
            )
        );

        console.logString(
            string.concat(
                "YEthToken deployed at: ",
                vm.toString(address(yETH))
            )
        );

        console.logString(
            string.concat(
                "OperatorDelegator deployed at: ",
                vm.toString(address(operatorDelegator))
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
