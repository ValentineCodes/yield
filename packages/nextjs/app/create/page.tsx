"use client";

import { type FC, useEffect, useState } from "react";
import { DEFAULT_TX_DATA, METHODS, Method, PredefinedTxData } from "../owners/page";
import { useIsMounted, useLocalStorage } from "usehooks-ts";
import { Address, parseEther } from "viem";
import { useChainId, useWalletClient } from "wagmi";
import * as chains from "wagmi/chains";
import { AddressInput, EtherInput, InputBase } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldContract, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

export type TransactionData = {
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

export const getPoolServerUrl = (id: number) =>
  id === chains.hardhat.id ? "http://localhost:49832/" : "https://backend.multisig.holdings:49832/";

const CreatePage: FC = () => {
  const isMounted = useIsMounted();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();

  const poolServerUrl = getPoolServerUrl(targetNetwork.id);

  const [ethValue, setEthValue] = useState("");
  const [operatorAddress, setOperatorAddress] = useState("")
  const { data: contractInfo } = useDeployedContractInfo("SafeMultiSigWallet");

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

  const txTo = predefinedTxData.methodName === "transferFunds" ? predefinedTxData.signer : contractInfo?.address;

  const { data: metaMultiSigWallet } = useScaffoldContract({
    contractName: "SafeMultiSigWallet",
  });

  const { data: operator, isLoading: isLoadingOperator } = useScaffoldContractRead({
    contractName: "OperatorDelegator",
    functionName: "getOperator"
  })

  const { write: delegate, isLoading: isLoadingDelegate } = useScaffoldContractWrite({
    contractName: "OperatorDelegator",
    functionName: "delegate",
    args: [operatorAddress]
  })

  const { write: undelegate } = useScaffoldContractWrite({
    contractName: "OperatorDelegator",
    functionName: "undelegate"
  })

  const { write: queueWithdrawal } = useScaffoldContractWrite({
    contractName: "OperatorDelegator",
    functionName: "queueWithdrawal"
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
        if (!contractInfo?.address || !predefinedTxData.amount || !txTo) {
          return;
        }

        const txData: TransactionData = {
          chainId: chainId,
          address: contractInfo.address,
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
                value={`# ${nonce}`}
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
              disabled={isLoadingDelegate}
              placeholder="Operator address"
              value={operatorAddress}
              onChange={value => setOperatorAddress(value)}
            />
            <button className="btn btn-secondary btn-sm" disabled={!walletClient || isLoadingDelegate} onClick={() => delegate()}>
              Delegate
            </button>
            <button className="btn btn-secondary btn-sm" disabled={!walletClient} onClick={() => undelegate()}>
              Undelegate
            </button>
            <button className="btn btn-secondary btn-sm" disabled={!walletClient} onClick={() => queueWithdrawal()}>
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
                value={`# ${nonce}`}
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
                value={`# ${nonce}`}
                placeholder={"loading..."}
                onChange={() => {
                  null;
                }}
              />
            </div>

            <div>
              <InputBase
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
