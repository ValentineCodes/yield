import React, { useEffect, useState } from 'react'
import { BlockieAvatar } from './scaffold-eth'
import { useContractRead, usePublicClient } from 'wagmi'
import { DELEGATION_MANAGER_ABI, DELEGATION_MANAGER_ADDRESS } from '~~/abis/DelegationManager'

type Props = {
    event: any,
    completeWithdrawal: (withdrawalParams: any) => void
}

export default function QueuedWithdrawal({ event, completeWithdrawal }: Props) {

    const [isReady, setIsReady] = useState(false)

    const publicClient = usePublicClient()

    const { data: minWithdrawalDelayBlocks, isLoading: isLoadingMinWithdrawalDelayBlocks } = useContractRead({
        abi: DELEGATION_MANAGER_ABI,
        address: DELEGATION_MANAGER_ADDRESS,
        functionName: "minWithdrawalDelayBlocks"
    })

    const checkWithdrawalCompletion = async () => {
        try {
            // latest block number
            const latestBlock = await publicClient.getBlockNumber()

            // Check if queued withdrawal is ready for completion
            if (latestBlock >= event.startBlock + minWithdrawalDelayBlocks) {
                setIsReady(true)
            } else {
                setIsReady(false)
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (isLoadingMinWithdrawalDelayBlocks) return

        checkWithdrawalCompletion()

    }, [minWithdrawalDelayBlocks, isLoadingMinWithdrawalDelayBlocks])

    const handleWithdrawalCompletion = async () => {
        const withdrawal = {
            staker: event.staker,
            delegatedTo: event.delegatedTo,
            withdrawer: event.withdrawer,
            nonce: event.nonce,
            startBlock: event.startBlock,
            strategies: event.strategies,
            shares: event.shares
        }

        completeWithdrawal(withdrawal)
    }

    return (
        <div className="flex flex-col pb-2 border-b border-secondary last:border-b-0">
            <div className="flex gap-4 justify-between">
                <div className="font-bold"># {String(event.nonce)}</div>
                <div className="flex gap-1 font-bold">
                    <BlockieAvatar size={20} address={event.withdrawRoot} /> {event.withdrawRoot.slice(0, 7)}
                </div>

                <div>{String(event.startBlock)}</div>

                <button
                    disabled={!isReady}
                    className="btn btn-xs btn-primary"
                    onClick={handleWithdrawalCompletion}
                >
                    {isReady ? "Complete" : "Queued"}
                </button>
            </div>
        </div>
    )
}