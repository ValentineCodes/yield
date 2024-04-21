// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @dev Error for 0x0 address inputs
error ZeroAddress();

/// @dev Error for already added items to a list
error AlreadyAdded();

/// @dev Error for not found items in a list
error NotFound();

/// @dev Error for hitting max TVL
error MaxTVLReached();

/// @dev Error for caller not having permissions
error NotRestakeManagerAdmin();

/// @dev Error for call not coming from deposit queue contract
error NotDepositQueue();

/// @dev Error for contract being paused
error ContractPaused();

/// @dev Error for invalid token decimals for collateral tokens (must be 18)
error InvalidTokenDecimals(uint8 expected, uint8 actual);

/// @dev Error when withdraw is already completed
error WithdrawAlreadyCompleted();

/// @dev Error when a different address tries to complete withdraw
error NotOriginalWithdrawCaller(address expectedCaller);

/// @dev Error when caller does not have OD admin role
error NotOperatorDelegatorAdmin();

/// @dev Error when caller is not RestakeManager contract
error NotRestakeManager();

/// @dev Error when delegation address was already set - cannot be set again
error DelegateAddressAlreadySet();

/// @dev Error when caller does not have ERC20 Rewards Admin role
error NotERC20RewardsAdmin();

/// @dev Error when ending token fails
error TransferFailed();

/// @dev Error when caller does not have ETH Minter Burner Admin role
error NotYETHMinterBurner();

/// @dev Error when caller does not have Token Admin role
error NotTokenAdmin();

/// @dev Error when array lengths do not match
error MismatchedArrayLengths();

/// @dev Error when caller does not have Deposit Withdraw Pauser role
error NotDepositWithdrawPauser();

/// @dev Error when an individual token TVL is over the max
error MaxTokenTVLReached();

/// @dev Error when calling an invalid function
error NotImplemented();

/// @dev Error when deposit amount is invalid
error InvalidDepositAmount();

/// @dev Error when calculating token amounts is invalid
error InvalidTokenAmount();

/// @dev Error when timestamp is invalid - likely in the past
error InvalidTimestamp(uint256 timestamp);

/// @dev Error when trade does not meet minimum output amount
error InsufficientOutputAmount();

/// @dev Error when the token received over the bridge is not the one expected
error InvalidTokenReceived();

/// @dev Error when the sender is not expected
error InvalidSender(address expectedSender, address actualSender);

/// @dev error when function returns 0 amount
error InvalidZeroOutput();
