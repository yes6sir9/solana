import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount, publicKey } from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { SOLANA_RPC_URL } from "./solanaConfig";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export interface MintPetNftInput {
  wallet: WalletContextState;
  petName: string;
  metadataUri: string;
}

export interface MintPetNftResult {
  mintAddress: string;
  signature: string;
}

/**
 * Mints a real Metaplex-standard NFT on Solana devnet.
 *
 * The connected Phantom wallet is used as the signer/identity via the
 * wallet-adapter bridge — the private key never leaves the extension, the
 * user approves the transaction in the Phantom popup, and this function
 * simply submits it. Devnet transaction fees (a fraction of a SOL) are
 * paid by the connected wallet; use a devnet faucet if it runs low.
 */
export async function mintPetNft({ wallet, petName, metadataUri }: MintPetNftInput): Promise<MintPetNftResult> {
  if (!wallet.publicKey) throw new Error("Connect your wallet first");

  const umi = createUmi(SOLANA_RPC_URL).use(mplTokenMetadata()).use(walletAdapterIdentity(wallet));

  const mint = generateSigner(umi);

  const { signature } = await createNft(umi, {
    mint,
    name: petName.slice(0, 32),
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    symbol: "PETNFT",
  }).sendAndConfirm(umi);

  return {
    mintAddress: mint.publicKey.toString(),
    signature: toBase64(signature),
  };
}

export function toUmiPublicKey(address: string) {
  return publicKey(address);
}
