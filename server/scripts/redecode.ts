// ============================================================
// One-time script: Re-decode all "unknown" action types
// Run with: npx tsx server/scripts/redecode.ts
// ============================================================

import "dotenv/config";
import { prisma, sanitizeForJson } from "../db";
import { ProtocolDecoder } from "../services/decoder";
import { buildAddressToProtocolMap } from "../../src/utils/constants";
import { Alchemy, Network } from "alchemy-sdk";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
});

const addressMap = buildAddressToProtocolMap();
const decoderMap: Record<string, string> = {};
for (const [addr, protocol] of Object.entries(addressMap)) {
  decoderMap[addr] = protocol;
}
const decoder = new ProtocolDecoder(decoderMap);

async function main() {
  const unknowns = await prisma.transaction.findMany({
    where: { actionType: { in: ["unknown", "Token Transfer", "Contract Interaction"] } },
    select: { txHash: true, toAddress: true, protocol: true },
  });

  console.log(`Found ${unknowns.length} transactions with "unknown" action type`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const tx of unknowns) {
    try {
      // Fetch the raw transaction to get input data
      const rawTx = await alchemy.core.getTransaction(tx.txHash);
      if (!rawTx || !rawTx.to) {
        skipped++;
        continue;
      }

      // Also fetch receipt for logs
      const receipt = await alchemy.core.getTransactionReceipt(tx.txHash);
      const logs = receipt?.logs?.map((l) => ({
        address: l.address,
        topics: l.topics as string[],
        data: l.data,
      })) || [];

      const decoded = decoder.decode({
        to: rawTx.to,
        input: rawTx.data,
        value: rawTx.value?.toString(),
        logs,
      });

      // Only update if the new action is more specific than what we have
      const generic = ["unknown", "Token Transfer", "Contract Interaction"];
      const isImprovement = decoded.functionName !== "unknown" && !generic.includes(decoded.actionType);

      if (isImprovement) {
        await prisma.transaction.update({
          where: { txHash: tx.txHash },
          data: {
            actionType: decoded.actionType,
            functionName: decoded.functionName,
            decodedData: sanitizeForJson(decoded) as any,
          },
        });
        updated++;
        if (updated % 50 === 0) console.log(`  Updated ${updated} so far...`);
      } else {
        skipped++;
      }
    } catch (err: any) {
      errors++;
      if (errors <= 5) console.error(`  Error on ${tx.txHash}: ${err.message}`);
    }

    // Small delay to avoid rate limiting
    if ((updated + skipped + errors) % 20 === 0) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
