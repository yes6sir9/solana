import { prisma } from "../db";
import { ApiError } from "../middleware/errorHandler";
import { assertOwnership, getPetById } from "./petService";
import { getOrCreateUser } from "./userService";

// Configurable marketplace economy knobs (brief section 23). Expressed in
// basis points (1/100 of a percent) so they're easy to tune precisely.
// Both are deducted from the sale price; the remainder goes to the seller.
export const MARKETPLACE_FEE_BPS = 250; // 2.5% platform fee -> treasury
export const MARKETPLACE_ROYALTY_BPS = 250; // 2.5% "creator" royalty -> treasury

export function computeSaleBreakdown(priceSol: number) {
  const platformFeeSol = Number(((priceSol * MARKETPLACE_FEE_BPS) / 10_000).toFixed(6));
  const royaltySol = Number(((priceSol * MARKETPLACE_ROYALTY_BPS) / 10_000).toFixed(6));
  const sellerProceedsSol = Number((priceSol - platformFeeSol - royaltySol).toFixed(6));
  return { priceSol, platformFeeSol, royaltySol, sellerProceedsSol };
}

export interface MarketplaceFilters {
  type?: string;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  minLevel?: number;
}

export async function listActiveListings(filters: MarketplaceFilters) {
  return prisma.marketplaceListing.findMany({
    where: {
      status: "ACTIVE",
      priceSol: {
        gte: filters.minPrice ?? undefined,
        lte: filters.maxPrice ?? undefined,
      },
      pet: {
        type: (filters.type as any) ?? undefined,
        rarity: (filters.rarity as any) ?? undefined,
        level: filters.minLevel ? { gte: filters.minLevel } : undefined,
      },
    },
    include: { pet: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Lists a pet for sale.
 *
 * MVP NOTE: this only records intent-to-sell in the backend database. A
 * production marketplace would escrow the NFT (or use an on-chain listing
 * account) so the seller cannot transfer/relist it elsewhere while listed.
 * See README "MVP / mock" section.
 */
export async function listPetForSale(sellerWallet: string, petId: string, priceSol: number) {
  if (priceSol <= 0) throw new ApiError(400, "Price must be greater than 0");
  const pet = await getPetById(petId);
  assertOwnership(pet, sellerWallet);

  const existing = await prisma.marketplaceListing.findFirst({
    where: { petId, status: "ACTIVE" },
  });
  if (existing) throw new ApiError(409, "Pet is already listed");

  const listing = await prisma.marketplaceListing.create({
    data: { petId, sellerWallet, priceSol },
  });

  await prisma.transaction.create({
    data: { type: "LIST", petId, walletAddress: sellerWallet, priceSol },
  });

  return listing;
}

export async function cancelListing(sellerWallet: string, listingId: string) {
  const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new ApiError(404, "Listing not found");
  if (listing.sellerWallet !== sellerWallet) throw new ApiError(403, "Not your listing");
  if (listing.status !== "ACTIVE") throw new ApiError(400, "Listing is not active");

  return prisma.marketplaceListing.update({
    where: { id: listingId },
    data: { status: "CANCELLED" },
  });
}

/**
 * Buys a listed pet.
 *
 * MVP NOTE: no real SOL changes hands here — the buyer is expected to have
 * already sent the SOL payment to the seller via a wallet-signed transfer
 * transaction in the frontend, and passes the transaction signature for
 * bookkeeping. This endpoint just flips ownership in the database. The
 * platform-fee/royalty split IS a real, configurable calculation
 * (computeSaleBreakdown) — what's mocked is only the actual fund transfer,
 * which a production marketplace would enforce atomically on-chain (e.g.
 * via the Anchor program's marketplace foundation, see README).
 */
export async function buyListing(buyerWallet: string, listingId: string, txSignature?: string) {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    include: { pet: true },
  });
  if (!listing) throw new ApiError(404, "Listing not found");
  if (listing.status !== "ACTIVE") throw new ApiError(400, "Listing is not active");
  if (listing.sellerWallet === buyerWallet) throw new ApiError(400, "Cannot buy your own listing");

  await getOrCreateUser(buyerWallet);
  const breakdown = computeSaleBreakdown(listing.priceSol);

  const [, , updatedPet] = await prisma.$transaction([
    prisma.marketplaceListing.update({ where: { id: listingId }, data: { status: "SOLD" } }),
    prisma.transaction.create({
      data: {
        type: "BUY",
        petId: listing.petId,
        walletAddress: buyerWallet,
        counterparty: listing.sellerWallet,
        priceSol: listing.priceSol,
      },
    }),
    prisma.pet.update({ where: { id: listing.petId }, data: { ownerWallet: buyerWallet } }),
  ]);

  return { listing, pet: updatedPet, txSignature: txSignature ?? null, breakdown };
}
