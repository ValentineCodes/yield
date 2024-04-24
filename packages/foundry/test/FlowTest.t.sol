// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";

import {RestakeManager} from "../contracts/RestakeManager.sol";
import {OperatorDelegator} from "../contracts/OperatorDelegator.sol";
import {RoleManager} from "../contracts/RoleManager.sol";
import {YEthToken} from "../contracts/YEthToken.sol";
import {IStrategy} from "../contracts/interfaces/IStrategy.sol";
import {IStrategyManager} from "../contracts/interfaces/IStrategyManager.sol";
import {IDelegationManager} from "../contracts/interfaces/IDelegationManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FlowTest is Test {

    address STRATEGY_MANAGER = 0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6;
    address DELEGATION_MANAGER = 0xA44151489861Fe9e3055d95adC98FbD462B948e7;
    address STETH_STRATEGY = 0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3;
    address OPERATOR = 0xf882cc8107996f15C272080E54fc1Eb036772530;
    address STETH = 0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034;

    address staker = 0x7a82bbfD10E3Ce5817dEcC0ee870e17D6853D901;
    address roleManagerAdmin = address(1);

    RoleManager roleManager;
    YEthToken yETH;
    RestakeManager restakeManager;
    OperatorDelegator operatorDelegator;
    IDelegationManager delegationManager;

    uint256 DEPOSIT_AMOUNT = 0.001 ether;

    function setUp() public {
         restakeManager = new RestakeManager();
        roleManager = new RoleManager(roleManagerAdmin, address(restakeManager));
        yETH = new YEthToken(roleManager);
        delegationManager = IDelegationManager(DELEGATION_MANAGER);

        // Deploy and delegate to an operator
        operatorDelegator = new OperatorDelegator(
            roleManager,
            IStrategyManager(STRATEGY_MANAGER),
            restakeManager,
            delegationManager,
            IStrategy(STETH_STRATEGY),
            STETH
        );

        vm.prank(roleManagerAdmin);
        operatorDelegator.delegate(OPERATOR);

        // Initialize contract
        restakeManager.initialize(
            STETH, 
            address(yETH), 
            address(operatorDelegator)
        );
    }

    function testDelegation() public view {
        assert(delegationManager.isDelegated(address(operatorDelegator)));
    }

    function testUndelegation() public {
        vm.prank(roleManagerAdmin);
        // undelegate from EigenLayer
        operatorDelegator.undelegate();

        // Ensure operator is undelegated
        assert(!delegationManager.isDelegated(address(operatorDelegator)));

        // Ensure operator is deleted
        assertEq(operatorDelegator.getOperator(), address(0));
    }

    function testDeposit() public {
        vm.startPrank(staker);
        // approve restake manager to spend stETH
        IERC20(STETH).approve(address(restakeManager), DEPOSIT_AMOUNT * 2);

        // First Deposit
        restakeManager.deposit(DEPOSIT_AMOUNT);

        // yETH minted should be 1 to 1 on first deposit into restake manager
        assertEq(yETH.balanceOf(staker), DEPOSIT_AMOUNT);

        // Second Deposit
        restakeManager.deposit(DEPOSIT_AMOUNT);

        console.log(yETH.balanceOf(staker));
        assertEq(yETH.balanceOf(staker), restakeManager.getMintAmount(DEPOSIT_AMOUNT) + DEPOSIT_AMOUNT);

        vm.stopPrank();
    }

    function testWithdrawal() public {
        vm.startPrank(staker);

        uint256 stakerSTETHBalBeforeDeposit = IERC20(STETH).balanceOf(staker);
        // approve restake manager to spend stETH
        IERC20(STETH).approve(address(restakeManager), stakerSTETHBalBeforeDeposit);

        // deposit
        restakeManager.deposit(stakerSTETHBalBeforeDeposit);
        vm.stopPrank();

        // queue withdrawal
        vm.startPrank(roleManagerAdmin);
        vm.recordLogs();

        operatorDelegator.queueWithdrawal();

        Vm.Log[] memory entries = vm.getRecordedLogs();

        (
            bytes32 withdrawRoot,
            address _staker, 
            address delegatedTo, 
            address withdrawer,
            uint256 nonce,
            uint32 startBlock,
            IStrategy[] memory _strategiesToWithdraw,
            uint256[] memory _shares
        ) = abi.decode(entries[2].data, (bytes32, address, address, address, uint256, uint32, IStrategy[], uint256[]));

        // Ensure withdrawal is queued
        assert(delegationManager.pendingWithdrawals(withdrawRoot));

        // skip to withdrawal block
        vm.roll(startBlock + delegationManager.minWithdrawalDelayBlocks());

        IDelegationManager.Withdrawal memory withdrawal = IDelegationManager.Withdrawal({
            staker: _staker,
            delegatedTo: delegatedTo,
            withdrawer: withdrawer,
            nonce: nonce,
            startBlock: startBlock,
            strategies: _strategiesToWithdraw,
            shares: _shares
        });

        // complete withdrawal
        operatorDelegator.completeWithdrawal(withdrawal);

        vm.stopPrank();

        uint256 operatorDelegatorBalBeforeWithdrawal = IERC20(STETH).balanceOf(address(operatorDelegator));

        // Ensure operator delegator received staked funds
        assert(operatorDelegatorBalBeforeWithdrawal != 0);

        uint256 stakerYETHBalBeforeWithdrawal = yETH.balanceOf(staker);

        vm.prank(staker);
        // withdraw stETH fro
        restakeManager.withdraw(stakerYETHBalBeforeWithdrawal);

        uint256 operatorDelegatorBalAfterWithdrawal = IERC20(STETH).balanceOf(address(operatorDelegator));
        uint256 stakerYETHBalAfterWithdrawal = IERC20(yETH).balanceOf(staker);

        // Ensure yETH was burned
        assertEq(stakerYETHBalAfterWithdrawal, 0);

        // Ensure operator delegator transfered stETH to staker
        assert(operatorDelegatorBalBeforeWithdrawal > operatorDelegatorBalAfterWithdrawal);

        // Ensure staker received stETH
        assert(IERC20(STETH).balanceOf(staker) > 0);
    }
}