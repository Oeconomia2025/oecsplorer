-- CreateTable
CREATE TABLE "token_balances" (
    "id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(42) NOT NULL,
    "token_address" VARCHAR(42) NOT NULL,
    "balance" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "token_balances_token_address_idx" ON "token_balances"("token_address");

-- CreateIndex
CREATE INDEX "token_balances_wallet_address_idx" ON "token_balances"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "token_balances_wallet_address_token_address_key" ON "token_balances"("wallet_address", "token_address");
