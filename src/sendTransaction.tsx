//@ts-nocheck

import AccountAbstraction from "@safe-global/account-abstraction-kit-poc";
import { EthersAdapter } from "@safe-global/protocol-kit";
import { GelatoRelayPack } from "@safe-global/relay-kit";
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
} from "@safe-global/safe-core-sdk-types";
import { MUMBAI_RPC_URL, sleep, fetchData } from "../utils/helpers";
import { ONRAMP_ADDRESS, RECIPIENT_ADDRESS } from "../utils/addresses";
import { ethers } from "ethers";

import dotenv from "dotenv";

dotenv.config();

/***
 * APPROACH:
 * Step 1: Set configuration of SAFE account, ONRAMP account, TRANSACTION object
 * Step 2: Initialize Account Abstraction SDK
 * Step 3: Enable Relay Kit
 * Step 4: Predict Safe Address based on Safe account configuration
 * Step 5: Send funds to the Safe account from the ONRAMP account
 * Step 6: Create metatransaction to send the funds from the Safe account to the recipient account
 * Step 7: Relay the metatransaction to the relayer
 * ***/

async function main() {
  // Step 1: Set configuration of SAFE account, ONRAMP account, TRANSACTION object
  const config = {
    SAFE_SIGNER_PRIVATE_KEY: process.env.OWNER_1_PRIVATE_KEY!, // INSERT PRIVATE KEY OF ACCOUNT BALANCE = 0
    RPC_URL: MUMBAI_RPC_URL,
    RELAY_API_KEY: process.env.GELATO_RELAY_API_KEY!, // INSERT API KEY GELATO
  };

  const mockOnRampConfig = {
    ADDRESS: ONRAMP_ADDRESS,
    PRIVATE_KEY: process.env.ONRAMP_PRIVATE_KEY!, // INSERT PRIVATE KEY OF ACCOUNT BALANCE > 0
  };

  const txConfig = {
    TO: RECIPIENT_ADDRESS,
    DATA: "0x",
    VALUE: ethers.parseUnits("0.006", "ether").toString(),
  };
  console.log(
    `Executing meta-transaction via Gelato Relay paid by 1Balance...`
  );

  // Step 2: Initialize Account Abstraction SDK
  const provider = new ethers.JsonRpcProvider(config.RPC_URL);
  const signer = new ethers.Wallet(config.SAFE_SIGNER_PRIVATE_KEY, provider);

  const safeAccountAbstraction = new AccountAbstraction(
    new EthersAdapter({
      ethers,
      signerOrProvider: signer,
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

  // Step 4: Predict Safe Address based on Safe account configuration
  const safeAddress = await safeAccountAbstraction.protocolKit.getAddress();
  console.log({ safeAddress });

  const isSafeDeployed =
    await safeAccountAbstraction.protocolKit.isSafeDeployed();
  console.log({ isSafeDeployed });

  // Step 5: Send funds to the Safe account from the ONRAMP account
  const safeBalance = await provider.getBalance(safeAddress);
  console.log(
    `Safe Balance: ${ethers.formatEther(safeBalance.toString())} MATIC`
  );
  const fakeOnRampSigner = new ethers.Wallet(
    mockOnRampConfig.PRIVATE_KEY,
    provider
  );
  const onRampResponse = await fakeOnRampSigner.sendTransaction({
    to: safeAddress,
    value: txConfig.VALUE,
  });
  console.log(
    `Funding the Safe with ${ethers.formatEther(
      txConfig.VALUE.toString()
    )} MATIC`
  );
  await onRampResponse.wait();

  const safeBalanceAfter = await provider.getBalance(safeAddress);
  console.log(
    `Safe balance after funding ${ethers.formatEther(
      safeBalanceAfter.toString()
    )} MATIC`
  );

  // Step 6: Create metatransaction to send the funds from the Safe account to the recipient account
  console.log(
    `Sending ${ethers.formatEther(txConfig.VALUE.toString())} MATIC to ${
      txConfig.TO
    }...`
  );
  const safeTransactions: MetaTransactionData[] = [
    {
      to: txConfig.TO,
      data: txConfig.DATA,
      value: txConfig.VALUE,
      operation: OperationType.Call,
    },
  ];
  const options: MetaTransactionOptions = {
    isSponsored: true,
  };

  // Step 7: Relay the metatransaction to the relayer
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
}
main();
