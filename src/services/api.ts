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

export async function fetchRecentTransactions(limit = 20) {
  return fetchAPI<Array<{
    hash: string;
    protocol: string;
    action: string;
    from: string;
    value: string;
    timestamp: string;
  }>>(`/transactions/recent?limit=${limit}`);
}

// -- Address Endpoints ------------------------------------------------------

export async function fetchAddress(address: string) {
  return fetchAPI(`/address/${address}`);
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
