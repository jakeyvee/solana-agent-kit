import { VoltrClient } from "voltr-sdk";
import { SolanaAgentKit } from "../agent";
import {
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";

/**
 * Withdraws assets from a Voltr strategy
 * @param agent SolanaAgentKit instance
 * @param withdrawAmount Amount to withdraw in base units (BN)
 * @param vault Public key of the target vault
 * @param vaultAssetMint Public key of the vault's asset mint
 * @param liquidityReserve Public key of the protocol's liquidity reserve
 * @param liquidityReserveAuth Public key of the liquidity reserve authority
 * @param protocolProgram Public key of the protocol program
 * @param remainingAccounts Array of additional accounts required for the protocol
 * @returns Transaction signature for the withdrawal
 */
export async function voltrWithdrawStrategy(
  agent: SolanaAgentKit,
  withdrawAmount: BN,
  vault: PublicKey,
  vaultAssetMint: PublicKey,
  liquidityReserve: PublicKey,
  liquidityReserveAuth: PublicKey,
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

  const withdrawIx = await vc.createWithdrawStrategyIx(withdrawAmount, {
    vault,
    vaultAssetMint,
    strategy: strategy,
    vaultStrategy: vaultStrategy,
    counterpartyAssetTa: liquidityReserve,
    counterpartyAssetTaAuth: liquidityReserveAuth,
    protocolProgram: protocolProgram,
    remainingAccounts,
  });

  const transaction = new Transaction();
  transaction.add(withdrawIx);

  const txSig = await sendAndConfirmTransaction(agent.connection, transaction, [
    agent.wallet,
  ]);
  return txSig;
}
