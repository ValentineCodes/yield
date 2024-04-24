const contracts = {
  31337: {
    SafeMultiSigWallet: {
      address: "0x56d13eb21a625eda8438f55df2c31dc3632034f5",
      abi: [
        {
          type: "constructor",
          inputs: [
            {
              name: "_chainId",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "_owners",
              type: "address[]",
              internalType: "address[]",
            },
            {
              name: "_signaturesRequired",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "receive",
          stateMutability: "payable",
        },
        {
          type: "function",
          name: "addSigner",
          inputs: [
            {
              name: "newSigner",
              type: "address",
              internalType: "address",
            },
            {
              name: "newSignaturesRequired",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "chainId",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "executeTransaction",
          inputs: [
            {
              name: "to",
              type: "address",
              internalType: "address payable",
            },
            {
              name: "value",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "data",
              type: "bytes",
              internalType: "bytes",
            },
            {
              name: "signatures",
              type: "bytes[]",
              internalType: "bytes[]",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bytes",
              internalType: "bytes",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "getTransactionHash",
          inputs: [
            {
              name: "_nonce",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "to",
              type: "address",
              internalType: "address",
            },
            {
              name: "value",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "data",
              type: "bytes",
              internalType: "bytes",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "isOwner",
          inputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "nonce",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "recover",
          inputs: [
            {
              name: "_hash",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "_signature",
              type: "bytes",
              internalType: "bytes",
            },
          ],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "pure",
        },
        {
          type: "function",
          name: "removeSigner",
          inputs: [
            {
              name: "oldSigner",
              type: "address",
              internalType: "address",
            },
            {
              name: "newSignaturesRequired",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "signaturesRequired",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "updateSignaturesRequired",
          inputs: [
            {
              name: "newSignaturesRequired",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "event",
          name: "Deposit",
          inputs: [
            {
              name: "sender",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "balance",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "ExecuteTransaction",
          inputs: [
            {
              name: "owner",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "to",
              type: "address",
              indexed: false,
              internalType: "address payable",
            },
            {
              name: "value",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "data",
              type: "bytes",
              indexed: false,
              internalType: "bytes",
            },
            {
              name: "nonce",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "hash",
              type: "bytes32",
              indexed: false,
              internalType: "bytes32",
            },
            {
              name: "result",
              type: "bytes",
              indexed: false,
              internalType: "bytes",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "Owner",
          inputs: [
            {
              name: "owner",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "added",
              type: "bool",
              indexed: false,
              internalType: "bool",
            },
          ],
          anonymous: false,
        },
      ],
    },
    RestakeManager: {
      address: "0xe8addd62fed354203d079926a8e563bc1a7fe81e",
      abi: [
        {
          type: "function",
          name: "deposit",
          inputs: [
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "getMintAmount",
          inputs: [
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getWithdrawAmount",
          inputs: [
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "initialize",
          inputs: [
            {
              name: "stETH",
              type: "address",
              internalType: "address",
            },
            {
              name: "yEth",
              type: "address",
              internalType: "address",
            },
            {
              name: "operatorDelegator",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "withdraw",
          inputs: [
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "event",
          name: "Deposit",
          inputs: [
            {
              name: "depositor",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "depositAmount",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "yETHMintAmount",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "Initialized",
          inputs: [
            {
              name: "version",
              type: "uint8",
              indexed: false,
              internalType: "uint8",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "Withdraw",
          inputs: [
            {
              name: "amountWithdraw",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "amountBurned",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "error",
          name: "InsufficientFunds",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidDepositAmount",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidZeroInput",
          inputs: [],
        },
        {
          type: "error",
          name: "NoWithdrawnFunds",
          inputs: [],
        },
      ],
    },
    RoleManager: {
      address: "0xe039608e695d21ab11675ebba00261a0e750526c",
      abi: [
        {
          type: "constructor",
          inputs: [
            {
              name: "roleManagerAdmin",
              type: "address",
              internalType: "address",
            },
            {
              name: "minterburnerAdmin",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "DEFAULT_ADMIN_ROLE",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "DEPOSIT_WITHDRAW_PAUSER",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "OPERATOR_DELEGATOR_ADMIN",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "RESTAKE_MANAGER_ADMIN",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "TOKEN_ADMIN",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "Y_ETH_MINTER_BURNER",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getRoleAdmin",
          inputs: [
            {
              name: "role",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "grantRole",
          inputs: [
            {
              name: "role",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "account",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "hasRole",
          inputs: [
            {
              name: "role",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "account",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "isDepositWithdrawPauser",
          inputs: [
            {
              name: "potentialAddress",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "isOperatorDelegatorAdmin",
          inputs: [
            {
              name: "potentialAddress",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "isRestakeManagerAdmin",
          inputs: [
            {
              name: "potentialAddress",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "isRoleManagerAdmin",
          inputs: [
            {
              name: "potentialAddress",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "isTokenAdmin",
          inputs: [
            {
              name: "potentialAddress",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "isYETHMinterBurner",
          inputs: [
            {
              name: "potentialAddress",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "renounceRole",
          inputs: [
            {
              name: "role",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "account",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "revokeRole",
          inputs: [
            {
              name: "role",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "account",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "supportsInterface",
          inputs: [
            {
              name: "interfaceId",
              type: "bytes4",
              internalType: "bytes4",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "event",
          name: "RoleAdminChanged",
          inputs: [
            {
              name: "role",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "previousAdminRole",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "newAdminRole",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "RoleGranted",
          inputs: [
            {
              name: "role",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "account",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "sender",
              type: "address",
              indexed: true,
              internalType: "address",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "RoleRevoked",
          inputs: [
            {
              name: "role",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "account",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "sender",
              type: "address",
              indexed: true,
              internalType: "address",
            },
          ],
          anonymous: false,
        },
        {
          type: "error",
          name: "ZeroAddress",
          inputs: [],
        },
      ],
    },
    YEthToken: {
      address: "0x071586ba1b380b00b793cc336fe01106b0bfbe6d",
      abi: [
        {
          type: "constructor",
          inputs: [
            {
              name: "_roleManager",
              type: "address",
              internalType: "contract IRoleManager",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "allowance",
          inputs: [
            {
              name: "owner",
              type: "address",
              internalType: "address",
            },
            {
              name: "spender",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "approve",
          inputs: [
            {
              name: "spender",
              type: "address",
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "balanceOf",
          inputs: [
            {
              name: "account",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "burn",
          inputs: [
            {
              name: "from",
              type: "address",
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "decimals",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint8",
              internalType: "uint8",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "decreaseAllowance",
          inputs: [
            {
              name: "spender",
              type: "address",
              internalType: "address",
            },
            {
              name: "subtractedValue",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "increaseAllowance",
          inputs: [
            {
              name: "spender",
              type: "address",
              internalType: "address",
            },
            {
              name: "addedValue",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "mint",
          inputs: [
            {
              name: "to",
              type: "address",
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "name",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "string",
              internalType: "string",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "roleManager",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "contract IRoleManager",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "s_paused",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "setPaused",
          inputs: [
            {
              name: "_paused",
              type: "bool",
              internalType: "bool",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "symbol",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "string",
              internalType: "string",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "totalSupply",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "transfer",
          inputs: [
            {
              name: "to",
              type: "address",
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "transferFrom",
          inputs: [
            {
              name: "from",
              type: "address",
              internalType: "address",
            },
            {
              name: "to",
              type: "address",
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "event",
          name: "Approval",
          inputs: [
            {
              name: "owner",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "spender",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "value",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "Transfer",
          inputs: [
            {
              name: "from",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "to",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "value",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "error",
          name: "ContractPaused",
          inputs: [],
        },
        {
          type: "error",
          name: "NotTokenAdmin",
          inputs: [],
        },
        {
          type: "error",
          name: "NotYETHMinterBurner",
          inputs: [],
        },
        {
          type: "error",
          name: "ZeroAddress",
          inputs: [],
        },
      ],
    },
    OperatorDelegator: {
      address: "0xe70f935c32da4db13e7876795f1e175465e6458e",
      abi: [
        {
          type: "constructor",
          inputs: [
            {
              name: "_roleManager",
              type: "address",
              internalType: "contract IRoleManager",
            },
            {
              name: "_strategyManager",
              type: "address",
              internalType: "contract IStrategyManager",
            },
            {
              name: "_restakeManager",
              type: "address",
              internalType: "contract IRestakeManager",
            },
            {
              name: "_delegationManager",
              type: "address",
              internalType: "contract IDelegationManager",
            },
            {
              name: "_strategy",
              type: "address",
              internalType: "contract IStrategy",
            },
            {
              name: "operator",
              type: "address",
              internalType: "address",
            },
            {
              name: "stETH",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "completeWithdrawal",
          inputs: [
            {
              name: "withdrawal",
              type: "tuple",
              internalType: "struct IDelegationManager.Withdrawal",
              components: [
                {
                  name: "staker",
                  type: "address",
                  internalType: "address",
                },
                {
                  name: "delegatedTo",
                  type: "address",
                  internalType: "address",
                },
                {
                  name: "withdrawer",
                  type: "address",
                  internalType: "address",
                },
                {
                  name: "nonce",
                  type: "uint256",
                  internalType: "uint256",
                },
                {
                  name: "startBlock",
                  type: "uint32",
                  internalType: "uint32",
                },
                {
                  name: "strategies",
                  type: "address[]",
                  internalType: "contract IStrategy[]",
                },
                {
                  name: "shares",
                  type: "uint256[]",
                  internalType: "uint256[]",
                },
              ],
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "deposit",
          inputs: [
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "shares",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "getStrategyIndex",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getTokenBalanceFromStrategy",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "queueWithdrawal",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "transferTokenToStaker",
          inputs: [
            {
              name: "staker",
              type: "address",
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "undelegate",
          inputs: [],
          outputs: [
            {
              name: "withdrawalRoot",
              type: "bytes32[]",
              internalType: "bytes32[]",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "event",
          name: "WithdrawQueued",
          inputs: [
            {
              name: "withdrawRoot",
              type: "bytes32",
              indexed: false,
              internalType: "bytes32",
            },
            {
              name: "staker",
              type: "address",
              indexed: false,
              internalType: "address",
            },
            {
              name: "delegatedTo",
              type: "address",
              indexed: false,
              internalType: "address",
            },
            {
              name: "withdrawer",
              type: "address",
              indexed: false,
              internalType: "address",
            },
            {
              name: "nonce",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "startBlock",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "strategies",
              type: "address[]",
              indexed: false,
              internalType: "contract IStrategy[]",
            },
            {
              name: "shares",
              type: "uint256[]",
              indexed: false,
              internalType: "uint256[]",
            },
          ],
          anonymous: false,
        },
        {
          type: "error",
          name: "NotFound",
          inputs: [],
        },
        {
          type: "error",
          name: "NotOperatorDelegatorAdmin",
          inputs: [],
        },
        {
          type: "error",
          name: "NotRestakeManager",
          inputs: [],
        },
        {
          type: "error",
          name: "ZeroAddress",
          inputs: [],
        },
      ],
    },
  },
} as const;

export default contracts;
