-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "accountLevel" INTEGER NOT NULL DEFAULT 1,
    "accountXp" INTEGER NOT NULL DEFAULT 0,
    "petCoins" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerWallet" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#8b5cf6',
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "seedHash" TEXT NOT NULL,
    "dnaHash" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "traits" TEXT NOT NULL,
    "bodyParams" TEXT NOT NULL,
    "palette" TEXT NOT NULL,
    "traitScore" INTEGER NOT NULL DEFAULT 0,
    "auraType" TEXT,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "equippedAccessoryKey" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "health" INTEGER NOT NULL DEFAULT 100,
    "hunger" INTEGER NOT NULL DEFAULT 100,
    "happiness" INTEGER NOT NULL DEFAULT 100,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "strength" INTEGER NOT NULL DEFAULT 10,
    "speed" INTEGER NOT NULL DEFAULT 10,
    "luck" INTEGER NOT NULL DEFAULT 10,
    "nftMintAddress" TEXT,
    "metadataUri" TEXT,
    "mintStatus" TEXT NOT NULL DEFAULT 'UNMINTED',
    "lastFedAt" DATETIME,
    "lastPlayedAt" DATETIME,
    "lastRestedAt" DATETIME,
    "lastTrainedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pet_ownerWallet_fkey" FOREIGN KEY ("ownerWallet") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MintPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signature" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "lamports" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MintPayment_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EconomySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "priceSol" REAL NOT NULL,
    "totalMinted" INTEGER NOT NULL,
    "mintedLastHour" INTEGER NOT NULL,
    "mintedLast24h" INTEGER NOT NULL,
    "demandMultiplier" REAL NOT NULL,
    "supplyMultiplier" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionLog_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "gameKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "coinsAwarded" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameSession_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "questKey" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "claimedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestClaim_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "icon" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerWallet" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_ownerWallet_fkey" FOREIGN KEY ("ownerWallet") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "sellerWallet" TEXT NOT NULL,
    "priceSol" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketplaceListing_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "petId" TEXT,
    "walletAddress" TEXT NOT NULL,
    "counterparty" TEXT,
    "priceSol" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyRewardClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "petCoinsAwarded" INTEGER NOT NULL,
    "itemKeyAwarded" TEXT,
    "claimedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyRewardClaim_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Pet_dnaHash_key" ON "Pet"("dnaHash");

-- CreateIndex
CREATE UNIQUE INDEX "Pet_nftMintAddress_key" ON "Pet"("nftMintAddress");

-- CreateIndex
CREATE INDEX "Pet_ownerWallet_idx" ON "Pet"("ownerWallet");

-- CreateIndex
CREATE UNIQUE INDEX "MintPayment_signature_key" ON "MintPayment"("signature");

-- CreateIndex
CREATE INDEX "ActionLog_walletAddress_action_createdAt_idx" ON "ActionLog"("walletAddress", "action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuestClaim_walletAddress_questKey_dayKey_key" ON "QuestClaim"("walletAddress", "questKey", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "Item_key_key" ON "Item"("key");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_ownerWallet_itemId_key" ON "InventoryItem"("ownerWallet", "itemId");
