-- CreateTable
CREATE TABLE "token_metadata_cache" (
    "contract_address" VARCHAR(42) NOT NULL,
    "symbol" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "decimals" INTEGER NOT NULL,
    "logo" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_metadata_cache_pkey" PRIMARY KEY ("contract_address")
);
