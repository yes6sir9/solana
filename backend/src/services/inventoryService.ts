import { prisma } from "../db";
import { ApiError } from "../middleware/errorHandler";
import { getOrCreateUser } from "./userService";
import { assertOwnership, getPetById } from "./petService";
import { MAX_STAT } from "../constants/petData";

const clamp = (value: number, min = 0, max = MAX_STAT) => Math.max(min, Math.min(max, value));

export async function getInventory(ownerWallet: string) {
  return prisma.inventoryItem.findMany({
    where: { ownerWallet, quantity: { gt: 0 } },
    include: { item: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function grantItem(ownerWallet: string, itemKey: string, quantity = 1) {
  await getOrCreateUser(ownerWallet);
  const item = await prisma.item.findUnique({ where: { key: itemKey } });
  if (!item) throw new ApiError(404, `Unknown item "${itemKey}"`);

  return prisma.inventoryItem.upsert({
    where: { ownerWallet_itemId: { ownerWallet, itemId: item.id } },
    update: { quantity: { increment: quantity } },
    create: { ownerWallet, itemId: item.id, quantity },
    include: { item: true },
  });
}

/** Applies an item's effect to a pet and decrements the stack by one. */
export async function useItem(ownerWallet: string, petId: string, itemKey: string) {
  const pet = await getPetById(petId);
  assertOwnership(pet, ownerWallet);

  const item = await prisma.item.findUnique({ where: { key: itemKey } });
  if (!item) throw new ApiError(404, `Unknown item "${itemKey}"`);

  const inventoryEntry = await prisma.inventoryItem.findUnique({
    where: { ownerWallet_itemId: { ownerWallet, itemId: item.id } },
  });
  if (!inventoryEntry || inventoryEntry.quantity < 1) {
    throw new ApiError(400, "You do not have this item");
  }

  const statDelta: Record<string, number> = {};
  switch (item.key) {
    case "kibble":
      statDelta.hunger = clamp(pet.hunger + 15);
      break;
    case "premium_meal":
      statDelta.hunger = clamp(pet.hunger + 40);
      break;
    case "chew_toy":
      statDelta.happiness = clamp(pet.happiness + 20);
      break;
    case "energy_potion":
      statDelta.energy = clamp(pet.energy + 30);
      break;
    case "health_potion":
      statDelta.health = clamp(pet.health + 25);
      break;
    case "training_weights":
      statDelta.strength = pet.strength + 2;
      break;
    case "speed_boots":
      statDelta.speed = pet.speed + 2;
      break;
    case "party_hat":
      // Cosmetic — no stat effect in this MVP.
      break;
    default:
      throw new ApiError(400, `Item "${item.key}" has no defined effect`);
  }

  const [updatedPet] = await prisma.$transaction([
    prisma.pet.update({ where: { id: petId }, data: statDelta }),
    prisma.inventoryItem.update({
      where: { id: inventoryEntry.id },
      data: { quantity: { decrement: 1 } },
    }),
  ]);

  return updatedPet;
}
