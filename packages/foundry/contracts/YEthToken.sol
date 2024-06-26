// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IYEthToken} from "./interfaces/IYEthToken.sol";
import {IRoleManager} from "./interfaces/IRoleManager.sol";
import "./Errors.sol";

/**
 * @title Yield ETH token
 * @author Yield
 * @notice This contract is the yETH ERC20 token
 * Ownership of the collateral in the protocol is tracked by the yETH token
 */
contract YEthToken is IYEthToken, ERC20 {
    /// @dev reference to the RoleManager contract
    IRoleManager public roleManager;

    /// @dev flag to control whether transfers are paused
    bool public s_paused;

    /// @dev Allows only a whitelisted address to mint or burn yETH tokens
    modifier onlyMinterBurner() {
        if (!roleManager.isYETHMinterBurner(msg.sender))
            revert NotYETHMinterBurner();
        _;
    }

    /// @dev Allows only a whitelisted address to pause or unpause the token
    modifier onlyTokenAdmin() {
        if (!roleManager.isTokenAdmin(msg.sender)) revert NotTokenAdmin();
        _;
    }

    constructor(IRoleManager _roleManager) ERC20("Yield ETH", "YETH") {
        if (address(_roleManager) == address(0x0)) revert ZeroAddress();

        roleManager = _roleManager;
    }

    /// @dev Allows minter/burner to mint new yETH tokens to an address
    function mint(address to, uint256 amount) external onlyMinterBurner {
        _mint(to, amount);
    }

    /// @dev Allows minter/burner to burn yETH tokens from an address
    function burn(address from, uint256 amount) external onlyMinterBurner {
        _burn(from, amount);
    }

    /// @dev Sets the paused flag
    function setPaused(bool _paused) external onlyTokenAdmin {
        s_paused = _paused;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        // If not paused return success
        if (!s_paused) {
            return;
        }

        // If paused, only minting and burning should be allowed
        if (from != address(0) && to != address(0)) {
            revert ContractPaused();
        }
    }
}
