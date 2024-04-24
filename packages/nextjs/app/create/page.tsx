"use client";

import { type FC, useEffect, useState } from "react";
import { DEFAULT_TX_DATA, METHODS, Method, PredefinedTxData } from "../owners/page";
import { useIsMounted, useLocalStorage } from "usehooks-ts";
import { Abi, Address, encodeFunctionData, formatEther, isAddress, parseEther } from "viem";
import { erc20ABI, useAccount, useChainId, useContractRead, useWalletClient } from "wagmi";
import * as chains from "wagmi/chains";
import { AddressInput, EtherInput, InputBase } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldContract, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

export type TransactionData = {
  abi: Abi,
  chainId: number;
  address: Address;
  nonce: bigint;
  to: string;
  amount: string;
  data: `0x${string}`;
  hash: string;
  signatures: `0x${string}`[];
  signers: Address[];
  validSignatures?: { signer: Address; signature: Address }[];
  requiredApprovals: bigint;
};

const STRATEGY_MANAGER = "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6";
const DELEGATION_MANAGER = "0xA44151489861Fe9e3055d95adC98FbD462B948e7";
const STETH_STRATEGY = "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3";
const OPERATOR = "0xf882cc8107996f15C272080E54fc1Eb036772530";
const STETH = "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034";

export const getPoolServerUrl = (id: number) =>
  id === chains.hardhat.id ? "http://localhost:49832/" : "https://backend.multisig.holdings:49832/";

const CreatePage: FC = () => {
  const isMounted = useIsMounted();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();
  const { address: connectedAccount } = useAccount()

  const poolServerUrl = getPoolServerUrl(targetNetwork.id);

  const [ethValue, setEthValue] = useState("");
  const [operatorAddress, setOperatorAddress] = useState("")
  const { data: safeMultisigWallet } = useDeployedContractInfo("SafeMultiSigWallet");

  const [predefinedTxData, setPredefinedTxData] = useLocalStorage<PredefinedTxData>("predefined-tx-data", {
    methodName: "transferFunds",
    signer: "",
    newSignaturesNumber: "",
    amount: "0",
  });

  const { data: nonce } = useScaffoldContractRead({
    contractName: "SafeMultiSigWallet",
    functionName: "nonce",
  });

  const { data: signaturesRequired } = useScaffoldContractRead({
    contractName: "SafeMultiSigWallet",
    functionName: "signaturesRequired",
  });

  const txTo = predefinedTxData.methodName === "transferFunds" ? predefinedTxData.signer : safeMultisigWallet?.address;

  const { data: metaMultiSigWallet } = useScaffoldContract({
    contractName: "SafeMultiSigWallet",
  });

  const { data: operator, isLoading: isLoadingOperator } = useScaffoldContractRead({
    contractName: "OperatorDelegator",
    functionName: "getOperator"
  })

  const { data: operatorDelegator } = useScaffoldContract({
    contractName: "OperatorDelegator"
  })

  const { data: operatorDelegatorStETHBalance } = useContractRead({
    abi: erc20ABI,
    address: STETH,
    functionName: "balanceOf",
    args: [operatorDelegator?.address || ""]
  })

  const { data: userStETHBalance } = useContractRead({
    abi: erc20ABI,
    address: STETH,
    functionName: "balanceOf",
    args: [connectedAccount || ""]
  })

  const { data: userYETHBalance } = useScaffoldContractRead({
    contractName: "YEthToken",
    functionName: "balanceOf",
    args: [connectedAccount || ""]
  })

  const handleCreate = async () => {
    try {
      if (!walletClient) {
        console.log("No wallet client!");
        return;
      }

      const newHash = (await metaMultiSigWallet?.read.getTransactionHash([
        nonce as bigint,
        String(txTo),
        BigInt(predefinedTxData.amount as string),
        predefinedTxData.callData as `0x${string}`,
      ])) as `0x${string}`;

      const signature = await walletClient.signMessage({
        message: { raw: newHash },
      });

      const recover = (await metaMultiSigWallet?.read.recover([newHash, signature])) as Address;

      const isOwner = await metaMultiSigWallet?.read.isOwner([recover]);

      if (isOwner) {
        if (!safeMultisigWallet?.address || !predefinedTxData.amount || !txTo) {
          return;
        }

        const txData: TransactionData = {
          abi: safeMultisigWallet.abi,
          chainId: chainId,
          address: safeMultisigWallet.address,
          nonce: nonce || 0n,
          to: txTo,
          amount: predefinedTxData.amount,
          data: predefinedTxData.callData as `0x${string}`,
          hash: newHash,
          signatures: [signature],
          signers: [recover],
          requiredApprovals: signaturesRequired || 0n,
        };

        await fetch(poolServerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            txData,
            // stringifying bigint
            (key, value) => (typeof value === "bigint" ? value.toString() : value),
          ),
        });

        setPredefinedTxData(DEFAULT_TX_DATA);

        setTimeout(() => {
          window.location.href = "/pool";
        }, 777);
      } else {
        notification.info("Only owners can propose transactions");
      }
    } catch (e) {
      notification.error("Error while proposing transaction");
      console.log(e);
    }
  };

  const handleDelegate = async () => {
    try {
      if (!walletClient) {
        console.log("No wallet client!");
        return;
      }

      if (!isAddress(operatorAddress)) {
        notification.info("Invalid operator address")
        return
      }

      const callData = encodeFunctionData({
        abi: operatorDelegator?.abi as Abi,
        functionName: "delegate",
        args: [operatorAddress]
      })

      const newHash = (await metaMultiSigWallet?.read.getTransactionHash([
        nonce as bigint,
        String(operatorDelegator?.address),
        BigInt("0" as string),
        callData as `0x${string}`,
      ])) as `0x${string}`;

      const signature = await walletClient.signMessage({
        message: { raw: newHash },
      });

      const recover = (await metaMultiSigWallet?.read.recover([newHash, signature])) as Address;

      const isOwner = await metaMultiSigWallet?.read.isOwner([recover]);

      if (isOwner) {
        if (!safeMultisigWallet?.address || !operatorDelegator) {
          return
        }

        const txData: TransactionData = {
          abi: operatorDelegator.abi,
          chainId: chainId,
          address: safeMultisigWallet.address,
          nonce: nonce || 0n,
          to: operatorDelegator.address,
          amount: "0",
          data: callData as `0x${string}`,
          hash: newHash,
          signatures: [signature],
          signers: [recover],
          requiredApprovals: signaturesRequired || 0n,
        };

        await fetch(poolServerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            txData,
            // stringifying bigint
            (key, value) => (typeof value === "bigint" ? value.toString() : value),
          ),
        });

        setTimeout(() => {
          window.location.href = "/pool";
        }, 777);
      } else {
        notification.info("Only owners can propose transactions");
      }

    } catch (error) {
      notification.error("Error while proposing transaction")
      console.log(error)
    }
  }

  const handleUndelegate = async () => {

  }

  const handleQueueWithdrawal = async () => {

  }

  const handleWithdrawalCompletion = async () => {

  }

  useEffect(() => {
    if (predefinedTxData && !predefinedTxData.callData && predefinedTxData.methodName !== "transferFunds") {
      setPredefinedTxData({
        ...predefinedTxData,
        methodName: "transferFunds",
        callData: "",
      });
    }
  }, [predefinedTxData, setPredefinedTxData]);

  return isMounted() ? (
    <div className="flex flex-col flex-1 items-center my-20 gap-8">
      <div className="flex items-center flex-col flex-grow w-full max-w-lg">
        <div className="flex flex-col bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl w-full p-6">
          <div>
            <label className="label">
              <span className="label-text">Nonce</span>
            </label>
            <InputBase
              disabled
              value={`# ${nonce}`}
              placeholder={"loading..."}
              onChange={() => {
                null;
              }}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="mt-6 w-full">
              <label className="label">
                <span className="label-text">Select method</span>
              </label>
              <select
                className="select select-bordered select-sm w-full bg-base-200 text-accent font-medium"
                value={predefinedTxData.methodName}
                onChange={e =>
                  setPredefinedTxData({
                    ...predefinedTxData,
                    methodName: e.target.value as Method,
                    callData: "" as `0x${string}`,
                  })
                }
              >
                {METHODS.map(method => (
                  <option key={method} value={method} disabled={method !== "transferFunds"}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <AddressInput
              placeholder={predefinedTxData.methodName === "transferFunds" ? "Recipient address" : "Signer address"}
              value={predefinedTxData.signer}
              onChange={signer => setPredefinedTxData({ ...predefinedTxData, signer: signer })}
            />

            {predefinedTxData.methodName === "transferFunds" && (
              <EtherInput
                value={ethValue}
                onChange={val => {
                  setPredefinedTxData({ ...predefinedTxData, amount: String(parseEther(val)) });
                  setEthValue(val);
                }}
              />
            )}

            <InputBase
              value={predefinedTxData.callData || ""}
              placeholder={"Calldata"}
              onChange={() => {
                null;
              }}
              disabled
            />

            <button className="btn btn-secondary btn-sm" disabled={!walletClient} onClick={handleCreate}>
              Create
            </button>

            <hr />

            <div>
              <label className="label">
                <span className="label-text">stETH Balance</span>
              </label>
              <InputBase
                disabled
                value={`# ${operatorDelegatorStETHBalance && formatEther(operatorDelegatorStETHBalance)}`}
                placeholder={"loading..."}
                onChange={() => {
                  null;
                }}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Operator</span>
              </label>
              <AddressInput
                disabled
                value={`${operator}`}
                placeholder={"loading..."}
                onChange={() => {
                  null;
                }}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Withdrawal in Queue. Blocks remaining</span>
              </label>
              <InputBase
                disabled
                value={`# ${nonce}`}
                placeholder={"loading..."}
                onChange={() => {
                  null;
                }}
              />
            </div>

            <AddressInput
              placeholder="Operator address"
              value={operatorAddress}
              onChange={value => setOperatorAddress(value)}
            />
            <button className="btn btn-secondary btn-sm" disabled={!walletClient} onClick={handleDelegate}>
              Delegate
            </button>
            <button className="btn btn-secondary btn-sm" disabled={!walletClient} onClick={handleUndelegate}>
              Undelegate
            </button>
            <button className="btn btn-secondary btn-sm" disabled={!walletClient} onClick={handleQueueWithdrawal}>
              Queue Withdrawal
            </button>
            <button className="btn btn-secondary btn-sm" disabled={!walletClient} onClick={handleWithdrawalCompletion}>
              Complete Withdrawal
            </button>

            <hr />

            <div>
              <label className="label">
                <span className="label-text">stETH Balance</span>
              </label>
              <InputBase
                disabled
                value={`# ${userStETHBalance && formatEther(userStETHBalance)}`}
                placeholder={"loading..."}
                onChange={() => {
                  null;
                }}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">yETH Balance</span>
              </label>
              <InputBase
                disabled
                value={`# ${userYETHBalance && formatEther(userYETHBalance)}`}
                placeholder={"loading..."}
                onChange={() => {
                  null;
                }}
              />
            </div>

            <div>
              <EtherInput
                value={''}
                placeholder="Deposit amount"
                onChange={() => {
                  null
                }}
              />
              <button className="btn btn-secondary btn-sm mt-2" disabled={!walletClient} onClick={() => null}>
                Deposit
              </button>
            </div>

            <div>
              <InputBase
                value={''}
                placeholder="Withdrawal amount"
                onChange={() => {
                  null
                }}
              />
              <button className="btn btn-secondary btn-sm mt-2" disabled={!walletClient} onClick={() => null}>
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default CreatePage;
