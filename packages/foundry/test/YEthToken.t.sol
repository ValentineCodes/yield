// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";

import {RoleManager} from "../contracts/RoleManager.sol";
import {YEthToken} from "../contracts/YEthToken.sol";

contract YEthTokenTest is Test {
    YEthToken yETH;

    address roleManagerAdmin = address(1);
    address staker = address(2);

    function setUp() public {
        yETH = new YEthToken(new RoleManager(roleManagerAdmin));
    }

    function testOnlyMinterBurnerAdminCanMintOrBurn() public {
        vm.startPrank(roleManagerAdmin);
        yETH.mint(staker, 1000);

        assertEq(yETH.balanceOf(staker), 1000);

        yETH.burn(staker, 1000);
        assertEq(yETH.balanceOf(staker), 0);
        
        vm.stopPrank();
    }

    function testRevertIfCallerNotMinterAdmin() public {
        vm.startPrank(staker);

        vm.expectRevert();
        yETH.mint(staker, 1000);
    }
}