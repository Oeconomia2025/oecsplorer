# WebSocket Feed

Real-time transaction streaming via Socket.IO with protocol-specific room subscriptions.

## Connection

```typescript
import { io } from "socket.io-client";

const socket = io("https://oecsplorer.oeconomia.io");

// Subscribe to all transactions
socket.emit("join", "all_transactions");

// Or subscribe to a specific protocol
socket.emit("join", "protocol:alluria");

// Listen for new transactions
socket.on("new_transaction", (data) => {
  console.log(data.summary);
  // { txHash, protocol, actionType, fromAddress, toAddress, ... }
});
```

## Available Rooms

| Room                   | Description                        |
| ---------------------- | ---------------------------------- |
| `all_transactions`     | Every transaction across all protocols |
| `protocol:oeconomia`   | Oeconomia protocol only            |
| `protocol:alluria`     | Alluria protocol only              |
| `protocol:eloqura`     | Eloqura protocol only              |
| `protocol:artivya`     | Artivya protocol only              |
| `protocol:iridescia`   | Iridescia protocol only            |

## Event Payload

```json
{
  "summary": {
    "txHash": "0x...",
    "blockNumber": 10412246,
    "blockTimestamp": "2026-02-28T15:30:00.000Z",
    "fromAddress": "0xba26...",
    "toAddress": "0x5cdb...",
    "protocol": "alluria",
    "actionType": "Transfer",
    "functionName": "transfer"
  }
}
```

## Frontend Hook

The explorer frontend uses a custom `useWebSocket` hook to manage the Socket.IO connection:

```typescript
import { useWebSocket } from "@/hooks/useWebSocket";

function Dashboard() {
  const { transactions, isConnected } = useWebSocket("all_transactions");

  return (
    <div>
      {transactions.map(tx => (
        <TransactionRow key={tx.txHash} tx={tx} />
      ))}
    </div>
  );
}
```

The hook handles connection lifecycle, room joining/leaving, and maintains a local transaction buffer for the live feed.

## Server-Side Broadcasting

Transactions are broadcast from two sources:

1. **Polling Indexer**: Every 5 minutes when new transactions are found
2. **Webhook Handler**: Instantly when Alchemy Notify delivers real-time events

Both sources use the same broadcast logic:

```typescript
// Broadcast to all subscribers
io.to("all_transactions").emit("new_transaction", { summary });

// Broadcast to protocol-specific room
io.to(`protocol:${decoded.protocol}`).emit("new_transaction", { summary });
```
