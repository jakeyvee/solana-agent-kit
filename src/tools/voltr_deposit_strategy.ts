import { VoltrClient } from "voltr-sdk";
import { SolanaAgentKit } from "../agent";
import {
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";

/**
 * Deposits assets into a Voltr strategy
 * @param agent SolanaAgentKit instance
 * @param depositAmount Amount to deposit in base units (BN)
 * @param vault Public key of the target vault
 * @param vaultAssetMint Public key of the vault's asset mint
 * @param liquidityReserve Public key of the protocol's liquidity reserve
 * @param protocolProgram Public key of the protocol program
 * @param remainingAccounts Array of additional accounts required for the protocol
 * @returns Transaction signature for the deposit
 */
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
