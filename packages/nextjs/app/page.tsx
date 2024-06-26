"use client";

import { type FC, useState } from "react";
import { useIsMounted } from "usehooks-ts";
import { Abi, Address, encodeFunctionData, formatEther, isAddress, parseEther } from "viem";
import { erc20ABI, useAccount, useChainId, useContractRead, useContractWrite, usePublicClient, useWalletClient } from "wagmi";
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
  const publicClient = usePublicClient()

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

  const { data: stETHAllowance, isLoading: isLoadingStETHAllowance } = useContractRead({
    abi: erc20ABI,
    address: STETH,
    functionName: "allowance",
    args: [connectedAccount || "", restakeManager?.address || ""]
  })

  const { data: userYETHBalance } = useScaffoldContractRead({
    contractName: "YEthToken",
    functionName: "balanceOf",
    args: [connectedAccount || ""]
  })

  const { data: yETHAllowance, isLoading: isLoadingYETHAllowance } = useScaffoldContractRead({
    contractName: "YEthToken",
    functionName: "allowance",
    args: [connectedAccount || "", restakeManager?.address || ""]
  })

  const { data: yETHAmountToMint, isLoading: isLoadingYEthAmountToMint } = useScaffoldContractRead({
    contractName: "RestakeManager",
    functionName: "getMintAmount",
    args: [parseEther(depositAmount)]
  })

  const { data: stETHAmountToWithdraw, isLoading: isLoadingStEthAmountToWithdraw } = useScaffoldContractRead({
    contractName: "RestakeManager",
    functionName: "getWithdrawAmount",
    args: [parseEther(withdrawAmount)]
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

  const signProposal = async (
    functionName: string,
    args: any[] = []
  ) => {
    try {
      if (!walletClient) {
        console.log("No wallet client!");
        return;
      }

      const callData = encodeFunctionData({
        abi: operatorDelegator?.abi as Abi,
        functionName: functionName,
        args: args
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

      // Only owner can make proposal
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

        // Save transaction data in the local database
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

  const handleDelegate = async () => {
    await signProposal("delegate", [operatorAddress])
  }

  const handleUndelegate = async () => {
    await signProposal("undelegate")
  }

  const handleQueueWithdrawal = async () => {
    await signProposal("queueWithdrawal")
  }

  const handleWithdrawalCompletion = async (withdrawalParams: any) => {
    await signProposal("completeWithdrawal", [withdrawalParams])
  }

  const handleDeposit = async () => {
    if (Number(depositAmount) <= 0) {
      notification.info("Invalid deposit amount")
      return
    }

    if (!restakeManager || stETHAllowance === undefined) {
      notification.info("Loading resources...")
      return
    }

    try {
      setIsDepositing(true)

      if (stETHAllowance < parseEther(depositAmount)) {
        // Approve restake manager to spend stETH
        const approveTx = await approveDeposit({ args: [restakeManager.address, parseEther(depositAmount)] })
        await publicClient.waitForTransactionReceipt({ hash: approveTx.hash })
      }

      // Deposit stETH into RestakeManager
      const depositTx = await deposit({ args: [parseEther(depositAmount)] })
      await publicClient.waitForTransactionReceipt({ hash: depositTx.hash })

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

    if (!restakeManager || yETHAllowance === undefined) {
      notification.info("Loading resources...")
      return
    }

    try {
      setIsWithdrawing(true)

      if (yETHAllowance < parseEther(withdrawAmount)) {
        // Approve restake manager to spend stETH
        const approveTx = await approveWithdraw({ args: [restakeManager.address, parseEther(withdrawAmount)] })
        await publicClient.waitForTransactionReceipt({ hash: approveTx.hash })
      }

      // Withdraw stETH from RestakeManager
      const withdrawTx = await withdraw({ args: [parseEther(withdrawAmount)] })
      await publicClient.waitForTransactionReceipt({ hash: withdrawTx.hash })

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

            <div className="flex items-center justify-between">
              <button className="btn btn-secondary btn-sm mt-2" disabled={!walletClient || isDepositing} onClick={handleDeposit}>
                {isDepositing ? "Depositing..." : "Deposit"}
              </button>

              {
                !Number(depositAmount) ? null
                  : !isLoadingYEthAmountToMint && yETHAmountToMint ?
                    <p>You get: {formatEther(yETHAmountToMint)} yETH</p>
                    :
                    <div className="animate-pulse flex space-x-4">
                      <div className="flex items-center space-y-6">
                        <div className="h-4 w-28 bg-slate-300 rounded"></div>
                      </div>
                    </div>
              }
            </div>
          </div>

          <div>
            <InputBase
              disabled={isWithdrawing}
              value={withdrawAmount}
              placeholder="Withdrawal amount"
              onChange={setWithdrawAmount}
            />

            <div className="flex items-center justify-between">
              <button className="btn btn-secondary btn-sm mt-2" disabled={!walletClient || isWithdrawing} onClick={handleWithdraw}>
                {isWithdrawing ? "Withdrawing..." : "Withdraw"}
              </button>

              {
                !Number(withdrawAmount) ? null
                  : !isLoadingStEthAmountToWithdraw && stETHAmountToWithdraw ?
                    <p>You get: {formatEther(stETHAmountToWithdraw)} stETH</p>
                    :
                    <div className="animate-pulse flex space-x-4">
                      <div className="flex items-center space-y-6">
                        <div className="h-4 w-28 bg-slate-300 rounded"></div>
                      </div>
                    </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default Home;
