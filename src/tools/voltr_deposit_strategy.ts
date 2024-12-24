import { VoltrClient } from "voltr-sdk";
import { SolanaAgentKit } from "../agent";
import {
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";

export async function voltrDepositStrategy(
  agent: SolanaAgentKit,
  depositAmount: BN,
  vault: PublicKey,
  vaultAssetMint: PublicKey,
  liquidityReserve: PublicKey,
  protocolProgram: PublicKey,
  remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[]
): Promise<string> {
  const vc = new VoltrClient(agent.connection, agent.wallet);
  const { vaultAssetIdleAuth } = vc.findVaultAddresses(vault);

  const { strategy, vaultStrategy } = vc.findStrategyAddresses(
    vault,
    vaultAssetIdleAuth,
    liquidityReserve
  );

  const depositIx = await vc.createDepositStrategyIx(depositAmount, {
    vault,
    vaultAssetMint,
    strategy: strategy,
    vaultStrategy: vaultStrategy,
    counterpartyAssetTa: liquidityReserve,
    protocolProgram: protocolProgram,
    remainingAccounts,
  });

  const transaction = new Transaction();
  transaction.add(depositIx);

  const txSig = await sendAndConfirmTransaction(agent.connection, transaction, [
    agent.wallet,
  ]);
  return txSig;
}
