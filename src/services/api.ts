// ============================================================
// Oeconomia Explorer — Frontend API Client
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// -- Generic Fetch Helper ---------------------------------------------------

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// -- Transaction Endpoints --------------------------------------------------

export async function fetchTransaction(hash: string) {
  return fetchAPI(`/tx/${hash}`);
}

export interface PaginatedTransactions {
  transactions: Array<{
    hash: string;
    protocol: string;
    action: string;
    from: string;
    to: string;
    value: string;
    timestamp: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export async function fetchRecentTransactions(limit = 25, offset = 0) {
  return fetchAPI<PaginatedTransactions>(`/transactions/recent?limit=${limit}&offset=${offset}`);
}

// -- Address Endpoints ------------------------------------------------------

export async function fetchAddress(address: string, txLimit = 25, txOffset = 0) {
  return fetchAPI(`/address/${address}?txLimit=${txLimit}&txOffset=${txOffset}`);
}

export async function fetchAddressTransactions(
  address: string,
  direction: "from" | "to" = "from",
  pageKey?: string
) {
  const params = new URLSearchParams({ direction });
  if (pageKey) params.set("pageKey", pageKey);
  return fetchAPI(`/address/${address}/transactions?${params}`);
}

// -- Block Endpoints --------------------------------------------------------

export async function fetchBlock(numberOrHash: string | number) {
  return fetchAPI(`/block/${numberOrHash}`);
}

export async function fetchLatestBlock() {
  return fetchAPI<{ blockNumber: number }>("/block/latest");
}

// -- Protocol Endpoints -----------------------------------------------------

export async function fetchProtocolStats(protocolId: string) {
  return fetchAPI(`/protocol/${protocolId}/stats`);
}

export async function fetchProtocolTransactions(
  protocolId: string,
  limit = 50,
  offset = 0
) {
  return fetchAPI(`/protocol/${protocolId}/transactions?limit=${limit}&offset=${offset}`);
}

// -- Search -----------------------------------------------------------------

export interface SearchResult {
  type: "tx" | "address" | "block" | "token" | "unknown";
  value: string;
  redirect: string | null;
}

export async function search(query: string): Promise<SearchResult> {
  return fetchAPI(`/search?q=${encodeURIComponent(query)}`);
}

// -- Tokens -----------------------------------------------------------------

export async function fetchTokens() {
  return fetchAPI("/tokens");
}

export async function fetchToken(address: string) {
  return fetchAPI(`/tokens/${address}`);
}

// -- Overview ---------------------------------------------------------------

export async function fetchOverview() {
  return fetchAPI("/overview");
}

// -- Statistics -------------------------------------------------------------

export async function fetchStats() {
  return fetchAPI<{
    totalTransactions: number;
    txLast24h: number;
    txLast7d: number;
    uniqueUsersTotal: number;
    uniqueUsers24h: number;
    protocolBreakdown: Array<{ protocol: string; total: number; last24h: number }>;
    dailyCounts: Array<{ date: string; count: number }>;
    mostActiveProtocol: string;
  }>("/stats");
}
