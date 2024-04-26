# Yield | Liquid Restaking Protocol

A protocol which enables users to stake **LIDO's stETH** into EigenLayer to earn extra rewards. The system takes stETH deposits and mints the right amount of **Yield Token(yETH)** based on the user's deposit, taking in consideration the total assets in the system and their appreciation over time based on staking rewards. Users can also withdraw their staked ETH but only after it has been withdrawn from EigenLayer by the admin. 

The admin, A **Safe MultiSig Wallet**, controls features such as pausing Yield Token transfers, withdrawing stETH from EigenLayer, delegating and undelegating operators.

<p align="center">
      <img src="images/yield.png" alt="Yield Protocol" width="100%">
</p>

## Environment Setup

Before you begin, you need to install the following tools:

- [Node (v18 LTS)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

Then download the challenge to your computer and install dependencies by running:

```sh
git clone https://github.com/ValentineCodes/yield.git
cd yield
yarn install
```

> In the same terminal, deploy contracts to Holesky testnet

Must set the enviromnent variables in foundry as specified in `.env.example` and the signers in `Deploy.s.sol`

```sh
yarn deploy:verify
```

> in a second terminal, start your frontend:

```sh
yarn start
```

📱 Open http://localhost:3000 to see the app.

> In a third terminal window, run your local backend server:

```bash
cd yield
yarn backend-local
```

---

## Configure Owners 🖋

🔏 The first step is to configure the owners, who will be able to propose, sign and execute transactions.

You can set the signers in the frontend, using the "Owners" tab:

![multisig-1](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/bc65bf00-93de-4f24-b42b-c78596cd54e0)

In this tab you can start your transaction proposal to either add or remove owners.

> 📝 Fill the form and click on "Create Tx".

![multisig-2](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/a74bb0c9-62de-4a12-932a-a5498bf12ecb)

This will take you to a populated transaction at "Create" page:

![multisig-3](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/5d4adfb8-66a6-49bb-b72c-3b4062f8e804)

> Create & sign the new transaction, clicking in the "Create" button:

![multisig-4](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/f8ef3f85-c543-468f-a008-6c4c8b9cf20a)

You will see the new transaction in the pool (this is all offchain).

You won't be able to sign it because on creation it already has one signature (from the frontend account).

> Click on the ellipsses button [...] to read the details of the transaction.

![multisig-5](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/25974706-a127-45f4-8a17-6f99b9e97104)

> ⛽️ Give your account some gas at the faucet and execute the transaction.

☑ Click on "Exec" to execute it, will be marked as "Completed" on the "Pool" tab, and will appear in the "Multisig" tab with the rest of executed transactions.

![multisig-6a](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/edf9218c-5b10-49b7-a564-e415c0d2f042)

![multisig-6b](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/7a7e5324-d5d1-4f10-918c-bfd7c72a52f8)

## Transfer Funds 💸

> You'll need to fund your Multisig Wallet

> You can find the address of the Multisig in the "Multisig" and "Debug Contracts" tabs.

> Create a transaction in the "Create" tab to send some funds to one of your signers, or to any other address of your choice:

![multisig-7](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/8b514add-fbe5-4a45-ae68-7659c827a5bf)

🖋 This time we will need a second signature (remember we've just updated the number of signatures required to execute a transaction to 2).

![multisig-8](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/2b7d8501-edfd-47d6-a6d2-937e7bb84caa)

> Switch account and sign the transaction with enough owners:

![multisig-9](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/ad667a69-499a-4ed4-8a40-52d500c94a5b)

(You'll notice you don't need ⛽️gas to sign transactions).

> Execute the transaction to transfer the funds:

![multisig-10](https://github.com/scaffold-eth/se-2-challenges/assets/55535804/2be26eda-ea09-4a0d-9f0e-d2151cfa26a4)

## Delegate and Undelegate an Operator 🤲

<p align="center">
      <img src="images/yield-delegate.png" alt="Delegate and Undelegate" width="100%">
</p>

🖋 This will take you to the Pool to sign and execute the transaction

## Queue Withdrawal ⏳

🖋 Withdrawals on EigenLayer take a while to complete. Queued withdrawals will appear like this 👇 after being executed.

<p align="center">
      <img src="images/yield-queueWithdrawal.png" alt="Queue Withdrawal" width="100%">
</p>

## Complete Withdrawal ⌛️

🖋 After the `minWithdrawalDelayBlocks`(currently **10**) is passed from the time of queue execution, You can complete withdrawal

<p align="center">
      <img src="images/yield-completeWithdrawal.png" alt="Complete Withdrawal" width="100%">
</p>

## Deposit stETH 💰

🖋 You can deposit stETH into EigenLayer and get some yETH token

<p align="center">
      <img src="images/yield-deposit.png" alt="Deposit StETH" width="100%">
</p>

(This will fail if there's no delegated operator in the system)

## Withdraw stETH 🤑

🖋 You can withdraw your staked stETH by burning your specified yETH tokens

<p align="center">
      <img src="images/yield-withdrawal.png" alt="Withdraw StETH" width="100%">
</p>

(This will fail if admin has not completely withdrawn staked stETH from EigenLayer)
