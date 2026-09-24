import { useState } from "react";
import type { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Pet } from "../types/pet";
import { Button } from "../components/Button";
import { mintPetNft } from "../services/nft";
import { petApi, extractErrorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import { METADATA_BASE_URL } from "../services/solanaConfig";

export const MintNftPanel: FC<{ pet: Pet; onMinted: (pet: Pet) => void }> = ({ pet, onMinted }) => {
  const wallet = useWallet();
  const { showToast } = useToast();
  const [minting, setMinting] = useState(false);

  if (pet.mintStatus === "MINTED") {
    return (
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold text-white mb-2">⛓ On-Chain NFT</h2>
        <p className="text-sm text-gray-400 mb-3">This pet is minted as a real NFT on Solana Devnet.</p>
        <div className="flex flex-col gap-1 text-xs">
          <a
            href={`https://explorer.solana.com/address/${pet.nftMintAddress}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="text-purple-300 hover:underline break-all"
          >
            View mint {pet.nftMintAddress} on Solana Explorer ↗
          </a>
        </div>
      </div>
    );
  }

  const handleMint = async () => {
    if (!wallet.publicKey) {
      showToast("Connect your wallet first", "error");
      return;
    }
    setMinting(true);
    try {
      const metadataUri = `${METADATA_BASE_URL}/api/metadata/${pet.id}`;
      const { mintAddress } = await mintPetNft({ wallet, petName: pet.name, metadataUri });
      const updated = await petApi.recordMint(pet.id, wallet.publicKey.toBase58(), mintAddress, metadataUri);
      onMinted(updated);
      showToast("NFT minted on Solana Devnet! 🎉", "success");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-bold text-white mb-2">Mint as NFT</h2>
      <p className="text-sm text-gray-400 mb-4">
        Turn {pet.name} into a real Metaplex-standard NFT on Solana Devnet. You'll approve the transaction in
        Phantom and pay a small devnet fee (get free devnet SOL from a faucet if needed).
      </p>
      <Button onClick={handleMint} loading={minting}>
        ⛓ Mint on Devnet
      </Button>
    </div>
  );
};
