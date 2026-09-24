import type { Pet } from "./pet";

export type ListingStatus = "ACTIVE" | "SOLD" | "CANCELLED";

export interface MarketplaceListing {
  id: string;
  petId: string;
  sellerWallet: string;
  priceSol: number;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  pet: Pet;
}
