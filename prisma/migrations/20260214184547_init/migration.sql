-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "tx_hash" VARCHAR(66) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "block_timestamp" TIMESTAMP(3) NOT NULL,
    "from_address" VARCHAR(42) NOT NULL,
    "to_address" VARCHAR(42),
    "value_wei" DECIMAL(65,30) NOT NULL,
    "gas_used" BIGINT NOT NULL,
    "gas_price" DECIMAL(65,30) NOT NULL,
    "status" BOOLEAN NOT NULL,
    "protocol" VARCHAR(20) NOT NULL,
    "action_type" VARCHAR(80) NOT NULL,
    "function_name" VARCHAR(80),
    "decoded_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_transfers" (
    "id" SERIAL NOT NULL,
    "tx_hash" VARCHAR(66) NOT NULL,
    "token_address" VARCHAR(42) NOT NULL,
    "token_symbol" VARCHAR(20),
    "from_address" VARCHAR(42) NOT NULL,
    "to_address" VARCHAR(42) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "decimals" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_positions" (
    "id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(42) NOT NULL,
    "protocol" VARCHAR(20) NOT NULL,
    "position_type" VARCHAR(30) NOT NULL,
    "position_data" JSONB NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_metrics" (
    "id" SERIAL NOT NULL,
    "protocol" VARCHAR(20) NOT NULL,
    "metric_name" VARCHAR(50) NOT NULL,
    "metric_value" DECIMAL(65,30) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "granularity" VARCHAR(10) NOT NULL DEFAULT 'hourly',

    CONSTRAINT "protocol_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexed_blocks" (
    "id" SERIAL NOT NULL,
    "block_number" BIGINT NOT NULL,
    "block_hash" VARCHAR(66) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tx_count" INTEGER NOT NULL,
    "oec_tx_count" INTEGER NOT NULL DEFAULT 0,
    "indexed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indexed_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tx_hash_key" ON "transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "transactions_tx_hash_idx" ON "transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "transactions_from_address_idx" ON "transactions"("from_address");

-- CreateIndex
CREATE INDEX "transactions_to_address_idx" ON "transactions"("to_address");

-- CreateIndex
CREATE INDEX "transactions_protocol_idx" ON "transactions"("protocol");

-- CreateIndex
CREATE INDEX "transactions_block_timestamp_idx" ON "transactions"("block_timestamp" DESC);

-- CreateIndex
CREATE INDEX "transactions_action_type_idx" ON "transactions"("action_type");

-- CreateIndex
CREATE INDEX "transactions_protocol_block_timestamp_idx" ON "transactions"("protocol", "block_timestamp" DESC);

-- CreateIndex
CREATE INDEX "token_transfers_from_address_idx" ON "token_transfers"("from_address");

-- CreateIndex
CREATE INDEX "token_transfers_to_address_idx" ON "token_transfers"("to_address");

-- CreateIndex
CREATE INDEX "token_transfers_token_symbol_idx" ON "token_transfers"("token_symbol");

-- CreateIndex
CREATE INDEX "token_transfers_token_address_idx" ON "token_transfers"("token_address");

-- CreateIndex
CREATE INDEX "wallet_positions_wallet_address_protocol_idx" ON "wallet_positions"("wallet_address", "protocol");

-- CreateIndex
CREATE INDEX "wallet_positions_protocol_position_type_idx" ON "wallet_positions"("protocol", "position_type");

-- CreateIndex
CREATE INDEX "protocol_metrics_protocol_metric_name_timestamp_idx" ON "protocol_metrics"("protocol", "metric_name", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "indexed_blocks_block_number_key" ON "indexed_blocks"("block_number");

-- CreateIndex
CREATE INDEX "indexed_blocks_block_number_idx" ON "indexed_blocks"("block_number" DESC);

-- AddForeignKey
ALTER TABLE "token_transfers" ADD CONSTRAINT "token_transfers_tx_hash_fkey" FOREIGN KEY ("tx_hash") REFERENCES "transactions"("tx_hash") ON DELETE RESTRICT ON UPDATE CASCADE;
