//@ts-nocheck

import AccountAbstraction from "@safe-global/account-abstraction-kit-poc";
import { EthersAdapter } from "@safe-global/protocol-kit";
import { GelatoRelayPack } from "@safe-global/relay-kit";
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
} from "@safe-global/safe-core-sdk-types";
import { ethers } from "ethers";
import {
  SAFE_PROXY_FACTORY_ADDRESS,
  SAFE_SINGLETON_ADDRESS,
  MUMBAI_RPC_URL,
  SAFE_VERSION,
  ZERO_ADDRESS,
  TARGET_TOPIC,
  SAFE_THRESHOLD,
  loadABI,
  sleep,
  randomIntFromInterval,
  fetchData,
} from "../utils/helpers";
import { SAFE_OWNER } from "../utils/addresses";
import dotenv from "dotenv";

dotenv.config();

/***
 * APPROACH:
 * Step 1: Set configuration
 * Step 2: Initialize Account Abstraction SDK
 * Step 3: Enable Relay Kit
 * Step 4: Load interfaces of `SafeProxyFactory` and `SafeSingleton` to encode parameters to pass as data in the raw transaction
 * Step 5: Encode initializer
 * Step 6: Encode `createProxyWithNonce` arguments
 * Step 7: Prepare raw metatransaction object to call the function `createProxyWithNonce` in the   `SafeProxyFactory` contract
 * Step 8: Relay the metatransaction to the relayer
 * Step 9: Query Gelato Network to fetch the status of the transaction
 * Step 10: Get event logs of the transaction and extract generated Safe account address
 * ***/

async function main() {
  const safeProxyFactoryABI = loadABI("../utils/SafeProxyFactoryABI.json");
  const safeSingletonABI = loadABI("../utils/SafeSingletonABI.json");

  interface Config {
    RPC_URL: string;
    DEPLOYER_ADDRESS_PRIVATE_KEY: string;
    SAFE_PROXY_FACTORY_ADDRRESS_MUMBAI: string;
    SAFE_PROXY_FACTORY_ABI_MUMBAI: string;
    SAFE_SINGLETON_ADDRESS_MUMBAI: string;
    SAFE_SINGLETON_ABI_MUMBAI: string;
    RELAY_API_KEY: string;
    DEPLOY_SAFE: {
      OWNERS: string[];
      THRESHOLD: number;
      SALT_NONCE: number;
      SAFE_VERSION: string;
    };
  }

  // Step 1: Set configuration
  let config: Config = {
    RPC_URL: MUMBAI_RPC_URL,
    DEPLOYER_ADDRESS_PRIVATE_KEY: process.env.OWNER_1_PRIVATE_KEY!, // INSERT PRIVATE KEY OF ACCOUNT BALANCE = 0
    SAFE_PROXY_FACTORY_ADDRRESS_MUMBAI: SAFE_PROXY_FACTORY_ADDRESS,
    SAFE_PROXY_FACTORY_ABI_MUMBAI: safeProxyFactoryABI,
    SAFE_SINGLETON_ABI_MUMBAI: safeSingletonABI,
    SAFE_SINGLETON_ADDRESS_MUMBAI: SAFE_SINGLETON_ADDRESS,
    RELAY_API_KEY: process.env.GELATO_RELAY_API_KEY!, // INSERT API KEY GELATO
    DEPLOY_SAFE: {
      OWNERS: [SAFE_OWNER],
      THRESHOLD: SAFE_THRESHOLD,
      SALT_NONCE: randomIntFromInterval(1000, 10000000000),
      SAFE_VERSION: SAFE_VERSION,
    },
  };

  // Step 2: Initialize Account Abstraction SDK
  const provider = new ethers.JsonRpcProvider(config.RPC_URL);
  const deployerSigner = new ethers.Wallet(
    config.DEPLOYER_ADDRESS_PRIVATE_KEY,
    provider
  );

  const deployerBalance = await provider.getBalance(
    config.DEPLOY_SAFE.OWNERS[0]
  );
  console.log(
    `[BEFORE DEPLOYING] Account balance of the owner: ${deployerBalance} MATIC`
  );

  const safeAccountAbstraction = new AccountAbstraction(
    new EthersAdapter({
      ethers,
      signerOrProvider: deployerSigner,
    })
  );

  await safeAccountAbstraction.init();

  // Step 3: Enable Relay Kit
  safeAccountAbstraction.setRelayKit(
    new GelatoRelayPack({
      apiKey: config.RELAY_API_KEY,
      protocolKit: safeAccountAbstraction.protocolKit,
    })
  );

  // Load safeFactoryContract if interacting without the relayer
  const safeFactoryContract = new ethers.Contract(
    config.SAFE_PROXY_FACTORY_ADDRRESS_MUMBAI,
    config.SAFE_PROXY_FACTORY_ABI_MUMBAI,
    deployerSigner
  );

  // Interact directly with safeFactoryContract without a relayer
  //
  // const createProxyWithNonce = await safeFactoryContract.createProxyWithNonce(
  //   config.SAFE_SINGLETON_ADDRESS_MUMBAI,
  //   init,
  //   config.DEPLOY_SAFE.SALT_NONCE
  // );

  // Step 4: Load interfaces of `SafeProxyFactory` and `SafeSingleton` to encode parameters to pass as data in the raw transaction
  const dataInterface = new ethers.Interface(
    config.SAFE_PROXY_FACTORY_ABI_MUMBAI
  );
  const initInterface = new ethers.Interface(config.SAFE_SINGLETON_ABI_MUMBAI);

  // Step 5: Encode initializer
  const init = initInterface.encodeFunctionData("setup", [
    config.DEPLOY_SAFE.OWNERS,
    config.DEPLOY_SAFE.THRESHOLD,
    ZERO_ADDRESS,
    "0x",
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    0,
    ZERO_ADDRESS,
  ]);

  // Step 6: Encode `createProxyWithNonce` arguments
  const data = dataInterface.encodeFunctionData("createProxyWithNonce", [
    config.SAFE_SINGLETON_ADDRESS_MUMBAI,
    init,
    config.DEPLOY_SAFE.SALT_NONCE,
  ]);

  // Step 7: Prepare raw metatransaction object to call the function `createProxyWithNonce` in the   `SafeProxyFactory` contract
  const safeTransactions: MetaTransactionData[] = [
    {
      to: config.SAFE_PROXY_FACTORY_ADDRRESS_MUMBAI,
      data: data,
      value: "0",
      operation: OperationType.Call,
    },
  ];

  const options: MetaTransactionOptions = {
    isSponsored: true,
  };

  console.log(`Deploying Safe now...`);

  // Step 8: Relay the metatransaction to the relayer
  const response = await safeAccountAbstraction.relayTransaction(
    safeTransactions,
    options
  );
  console.log(`Gelato Relayer TaskId: ${response.taskId}`);

  await sleep(30000);

  // Step 9: Query Gelato Network to fetch the status of the transaction
  let status = await fetchData(
    `https://api.gelato.digital/tasks/status/${response.taskId}`
  );

  if (typeof status.task.transactionHash !== "undefined") {
    console.log(
      `Transaction hash: https://mumbai.polygonscan.com/tx/${status.task.transactionHash}`
    );
  }

  // Maximum number of attempts
  const maxAttempts = 2;

  let attempts = 0;
  while (
    typeof status.task.transactionHash === "undefined" &&
    attempts < maxAttempts
  ) {
    console.log(`Trying again...`);
    await sleep(3000);

    attempts++;

    status = await fetchData(
      `https://api.gelato.digital/tasks/status/${response.taskId}`
    );

    // Log the attempt
    console.log(`Attempt ${attempts}: Waiting for transactionHash...`);
    if (typeof status.task.transactionHash !== "undefined") {
      console.log(
        `Transaction hash: https://mumbai.polygonscan.com/tx/${status.task.transactionHash}`
      );
      break;
    }
  }

  if (attempts === maxAttempts) {
    console.log(
      `Maximum attempts reached. TransactionHash is still undefined.`
    );
    return;
  }

  // Step 10: Get event logs of the transaction and extract generated Safe account address
  provider
    .getTransactionReceipt(status.task.transactionHash)
    .then((receipt) => {
      if (receipt && receipt.logs) {
        const targetTopic = TARGET_TOPIC;

        receipt.logs.forEach((log) => {
          if (log.topics.includes(targetTopic)) {
            console.log(`Safe Address: ${log.address}`);
            console.log(
              `View on polygonscan: https://mumbai.polygonscan.com/address/${log.address}`
            );

            console.log(
              `[AFTER DEPLOYING] Account balance of the owner: ${deployerBalance} MATIC`
            );
          }
        });
      } else {
        console.log("No logs found for the transaction.");
      }
    })
    .catch((error) => {
      console.error("Error fetching transaction receipt:", error);
    });
}

main();
