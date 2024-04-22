// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";

import {RoleManager} from "../contracts/RoleManager.sol";

contract RoleManagerTest is Test {
    RoleManager roleManager;

    address roleManagerAdmin = address(1);

    function setUp() public {
        roleManager = new RoleManager(roleManagerAdmin);
    }

    function testRoleGrant() public view {
        assert(
            roleManager.isRoleManagerAdmin(roleManagerAdmin)
        );
    }
}
