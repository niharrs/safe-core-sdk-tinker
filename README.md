  <h1 align="center" style="font-size: 3em;"> 🧠 Tinkering with </h1>
  <img alt="Safe {Core} SDK" src="https://user-images.githubusercontent.com/6764315/253083991-7202a24a-2981-4b31-9cf5-ace1c3b2c4fa.png" style="max-width: 100%;" align="center">
  <br/>

<h3 align="center">
    <p>The Safe{Core} SDK helps developers to abstract the complexity of setting up a smart contract account.</p>
</h3>

<p align="center">
        <img alt="SafeVersion" src="https://img.shields.io/badge/Safe Version-v1.3.0-blue.svg">
        <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg">
        <img alt="Contributions" src="https://img.shields.io/badge/Contributions-Welcome-blue.svg">
        <img alt="Documentation" src="https://img.shields.io/badge/Documentation-Yes-blue.svg">
        <img alt="Typescript" src="https://img.shields.io/badge/TypeScript-Yes-blue.svg">
</p>

## 🎯 Scope of this repo

The repository facilitates seamless integration and testing of the Safe{Core} SDK within a dummy application. It guides users through initializing the SDK and executing the following end-user workflows:

- Deploy a 1/1 Safe without funds in the owner’s wallet using a relayer
- Sending sponsored transactions to any address from the Safe

```
ℹ️ Ready to run on Polygon Mumbai testnet
```

Ideal for developers exploring Safe{Core} SDK functionalities.

## 🎬 Demo video

#### Part 1: Deploy a 1/1 Safe without funds in the owner’s wallet using a relayer

[![Watch the Loom Video](https://drive.google.com/uc?id=1BYS5OpQLypWet3baHdXBdp_4mWxXwm5B)](https://www.loom.com/share/3acb8107a4d14f5abc0b5e03ce1c446f?sid=300b021a-d384-40df-8c7a-6d4f444fe97f)

<br/>

#### Part 2: Sending sponsored transactions to any address from the Safe

[![Watch the Loom Video](https://drive.google.com/uc?id=1P1ZwyGjPRN_P4-pN3tX-leXuRgf1Cv1p)](https://www.loom.com/share/0bbb5bc9f1094bb082c5ca39cd6bed5e?sid=d348b8d4-ddc5-439a-b473-e5a39c928915)

## 🏗️ Installation

### Step 1: Clone the repo

```bash
git clone https://github.com/niharrs/safe-core-sdk-tinker
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Create .env

Create a .env file in which you might want to store your private keys and API keys.

```dotenv
export ONRAMP_PRIVATE_KEY=''
export OWNER_1_PRIVATE_KEY=''
export GELATO_RELAY_API_KEY=''
```

`ONRAMP_PRIVATE_KEY` : this account should have balance > 0
`OWNER_1_PRIVATE_KEY` : this can be an empty account
`GELATO_RELAY_API_KEY` : your Gelato Relay API key. You can get it from [here](https://app.gelato.network/functions).

### Step 4: Populate addresses

In `utils/addresses.tsx` you will replace the addresses with the relevant addresses.

### Step 5: Run the scripts

#### Part 1: Deploy a 1/1 Safe without funds in the owner’s wallet using a relayer

```bash
npx tsx --no-warnings src/deploySafe.tsx
```

#### Part 2: Sending sponsored transactions to any address from the Safe

```bash
npx tsx --no-warnings src/sendTransaction.tsx
```

## 🔎 Quick overview of the approach followed

### Part 1: Deploy a 1/1 Safe without funds in the owner’s wallet using a relayer

- Step 1: Set configuration
- Step 2: Initialize Account Abstraction SDK
- Step 3: Enable Relay Kit
- Step 4: Load interfaces of `SafeProxyFactory` and `SafeSingleton` to encode parameters to pass as data in the raw transaction
- Step 5: Encode initializer
- Step 6: Encode `createProxyWithNonce` arguments
- Step 7: Prepare raw metatransaction object to call the function `createProxyWithNonce` in the `SafeProxyFactory` contract
- Step 8: Relay the metatransaction to the relayer
- Step 9: Query Gelato Network to fetch the status of the transaction
- Step 10: Get event logs of the transaction and extract generated Safe account address

### Part 2: Sending sponsored transactions to any address from the Safe

- Step 1: Set configuration of Safe account, onramp account, transaction object
- Step 2: Initialize Account Abstraction SDK
- Step 3: Enable Relay Kit
- Step 4: Predict Safe Address based on Safe account configuration
- Step 5: Send funds to the Safe account from the onramp account
- Step 6: Create metatransaction to send the funds from the Safe account to the recipient account
- Step 7: Relay the metatransaction to the relayer

## 📚 Learn more

| Resource                                                                                        | Description                                                             |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [Documentation](https://docs.safe.global/getting-started/readme)                                | Full Safe Documentation                                                 |
| [Safe {Core} SDK](https://github.com/safe-global/safe-core-sdk/tree/main)                       | Github repository                                                       |
| [Safe {Core} SDK Playground](https://github.com/safe-global/safe-core-sdk/tree/main/playground) | Example implementations                                                 |
| [Dev Support](https://ethereum.stackexchange.com/questions/tagged/safe-core-sdk)                | Safe Core SDK Stackexchange                                             |
| [ETH Global Safe {Core} SDK Demo](https://www.youtube.com/watch?v=seQNBoUnwEI&t=998s)           | ETH Global — Safe 🛠️ Building with the Safe{Core} SDK - Manuel Gellfart |
| [Safe{Con} 2023 Workshop](https://www.youtube.com/watch?v=dx4WPWnw9DQ&t=957s)                   | Building on Safe{Core} Protocol with Germán (Safe)                      |
