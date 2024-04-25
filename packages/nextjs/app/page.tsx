"use client";

import { type FC, useState } from "react";
import { useIsMounted } from "usehooks-ts";
import { Abi, Address, encodeFunctionData, formatEther, isAddress, parseEther } from "viem";
import { erc20ABI, useAccount, useChainId, useContractRead, useContractWrite, useWalletClient } from "wagmi";
import { AddressInput, EtherInput, InputBase } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldContract, useScaffoldContractRead, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";
import QueuedWithdrawal from "~~/components/QueuedWithdrawal";

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

const STETH = "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034";

export const getPoolServerUrl = (id: number) => "http://localhost:49832/";

const Home: FC = () => {
  const isMounted = useIsMounted();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();
  const { address: connectedAccount } = useAccount()

  const poolServerUrl = getPoolServerUrl(targetNetwork.id);

  const [operatorAddress, setOperatorAddress] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")

  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const { data: safeMultisigWallet } = useDeployedContractInfo("SafeMultiSigWallet");
  const { data: restakeManager } = useDeployedContractInfo("RestakeManager")
  const { data: yETHToken } = useDeployedContractInfo("YEthToken")

  const { data: nonce } = useScaffoldContractRead({
    contractName: "SafeMultiSigWallet",
    functionName: "nonce",
  });

  const { data: signaturesRequired } = useScaffoldContractRead({
    contractName: "SafeMultiSigWallet",
    functionName: "signaturesRequired",
  });

  const { data: isOwner } = useScaffoldContractRead({
    contractName: "SafeMultiSigWallet",
    functionName: "isOwner",
    args: [connectedAccount]
  })

  const { data: metaMultiSigWallet } = useScaffoldContract({
    contractName: "SafeMultiSigWallet",
  });

  const { data: operator } = useScaffoldContractRead({
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

  const { writeAsync: approveDeposit } = useContractWrite({
    abi: erc20ABI,
    address: STETH,
    functionName: "approve"
  })

  const { writeAsync: approveWithdraw } = useContractWrite({
    abi: erc20ABI,
    address: yETHToken?.address,
    functionName: "approve"
  })

  const { writeAsync: deposit } = useContractWrite({
    abi: restakeManager?.abi,
    address: restakeManager?.address,
    functionName: "deposit"
  })

  const { writeAsync: withdraw } = useContractWrite({
    abi: restakeManager?.abi,
    address: restakeManager?.address,
    functionName: "withdraw"
  })

  const { data: queueWithdrawalEvents } = useScaffoldEventHistory({
    contractName: "OperatorDelegator",
    eventName: "WithdrawQueued",
    fromBlock: 1416542n
  })

  const { data: completeWithdrawalEvents } = useScaffoldEventHistory({
    contractName: "OperatorDelegator",
    eventName: "WithdrawalComplete",
    fromBlock: 1416542n
  })

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
    try {
      if (!walletClient) {
        console.log("No wallet client!");
        return;
      }

      const callData = encodeFunctionData({
        abi: operatorDelegator?.abi as Abi,
        functionName: "undelegate"
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

  const handleQueueWithdrawal = async () => {
    try {
      if (!walletClient) {
        console.log("No wallet client!");
        return;
      }

      const callData = encodeFunctionData({
        abi: operatorDelegator?.abi as Abi,
        functionName: "queueWithdrawal"
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

  const handleWithdrawalCompletion = async (withdrawalParams: any) => {
    try {
      if (!walletClient) {
        console.log("No wallet client!");
        return;
      }

      const callData = encodeFunctionData({
        abi: operatorDelegator?.abi as Abi,
        functionName: "completeWithdrawal",
        args: [withdrawalParams]
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

  const handleDeposit = async () => {
    if (Number(depositAmount) <= 0) {
      notification.info("Invalid deposit amount")
      return
    }

    if (!restakeManager) {
      notification.info("Loading resources...")
      return
    }

    try {
      setIsDepositing(true)
      // Approve restake manager to spend stETH
      await approveDeposit({ args: [restakeManager.address, parseEther(depositAmount)] })

      // Deposit stETH into RestakeManager
      await deposit({ args: [parseEther(depositAmount)] })

      setDepositAmount("")

    } catch (error) {
      notification.error("Error depositing");
      console.log(error);
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    if (Number(withdrawAmount) <= 0) {
      notification.info("Invalid withdraw amount")
      return
    }

    if (!restakeManager) {
      notification.info("Loading resources...")
      return
    }

    try {
      setIsWithdrawing(true)
      // Approve restake manager to spend stETH
      await approveWithdraw({ args: [restakeManager.address, parseEther(withdrawAmount)] })

      // Deposit yETH to withdraw stETH from RestakeManager
      await withdraw({ args: [parseEther(withdrawAmount)] })

      setWithdrawAmount("")

    } catch (error) {
      notification.error("Error withdrawing");
      console.log(error);
    } finally {
      setIsWithdrawing(false)
    }
  }

  return isMounted() ? (
    <div className="flex flex-col flex-1 items-center my-20 gap-8">
      <div className="flex items-center flex-col flex-grow w-full max-w-lg">
        <div className="flex flex-col bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl w-full p-6">

          {isOwner ? (
            <>
              <h1 className="font-bold">Admin</h1>

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

              <div className="mb-2">
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

              <AddressInput
                placeholder="Operator address"
                value={operatorAddress}
                onChange={value => setOperatorAddress(value)}
              />
              <button className="btn btn-secondary btn-sm mt-2" disabled={!walletClient} onClick={handleDelegate}>
                Delegate
              </button>
              <button className="btn btn-secondary btn-sm mt-2" disabled={!walletClient} onClick={handleUndelegate}>
                Undelegate
              </button>
              <button className="btn btn-secondary btn-sm mt-2" disabled={!walletClient} onClick={handleQueueWithdrawal}>
                Queue Withdrawal
              </button>

              <div className="mt-4">
                {!queueWithdrawalEvents || !completeWithdrawalEvents ?
                  "Loading..."
                  : queueWithdrawalEvents.filter(event => {
                    const completeWithdrawalNonces = completeWithdrawalEvents.map(e => e.args.withdraw?.nonce)
                    return !completeWithdrawalNonces.includes(event.args.nonce)
                  }).map(event => (
                    <QueuedWithdrawal
                      event={event.args}
                      completeWithdrawal={handleWithdrawalCompletion}
                    />
                  ))
                }
              </div>

              <hr className="my-4" />
            </>
          ) : null}

          <h1 className="font-bold">User</h1>

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

          <div className="my-2">
            <EtherInput
              disabled={isDepositing}
              value={depositAmount}
              placeholder="Deposit amount"
              onChange={setDepositAmount}
            />
            <button className="btn btn-secondary btn-sm mt-2" disabled={!walletClient || isDepositing} onClick={handleDeposit}>
              Deposit
            </button>
          </div>

          <div>
            <InputBase
              disabled={isWithdrawing}
              value={withdrawAmount}
              placeholder="Withdrawal amount"
              onChange={setWithdrawAmount}
            />
            <button className="btn btn-secondary btn-sm mt-2" disabled={!walletClient || isWithdrawing} onClick={handleWithdraw}>
              Withdraw
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default Home;
