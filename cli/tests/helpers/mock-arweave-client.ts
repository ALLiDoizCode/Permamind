/**
 * Mock Arweave Client for Integration Testing
 * Story 8.10: Cross-compatibility integration tests
 *
 * This mock client replaces the real Arweave client to avoid network calls
 * during integration testing.
 */

import { JWKInterface } from 'arweave/node/lib/wallet';

export interface MockTransaction {
  id: string;
  owner: string;
  tags: Array<{ name: string; value: string }>;
  data: Buffer;
  signature: string;
}

export interface MockArweaveClientInterface {
  upload(data: Buffer, tags: Array<{ name: string; value: string }>): Promise<string>;
  download(txId: string): Promise<Buffer>;
  sign(transaction: any, wallet: JWKInterface): Promise<any>;
  getStatus(txId: string): Promise<{ status: number; confirmed: boolean }>;
  getBalance(address: string): Promise<string>;
  clear(): void;
}

/**
 * MockArweaveClient - In-memory implementation for testing
 */
export class MockArweaveClient implements MockArweaveClientInterface {
  private storage: Map<string, Buffer> = new Map();
  private txCounter: number = 0;

  /**
   * Upload transaction data and return mock transaction ID
   */
  async upload(
    data: Buffer,
    tags: Array<{ name: string; value: string }>
  ): Promise<string> {
    // Generate deterministic transaction ID (43 chars base64url)
    const txId = `mock_tx_${this.txCounter.toString().padStart(38, '0')}`;
    this.txCounter++;

    // Store bundle in memory for later retrieval
    this.storage.set(txId, data);

    return txId;
  }

  /**
   * Download transaction data by ID
   */
  async download(txId: string): Promise<Buffer> {
    const data = this.storage.get(txId);
    if (!data) {
      throw new Error(`Transaction ${txId} not found`);
    }
    return data;
  }

  /**
   * Sign transaction with wallet
   */
  async sign(transaction: any, wallet: JWKInterface): Promise<any> {
    // Mock signing - just return transaction with signature field
    return {
      ...transaction,
      signature: 'mock_signature_' + Math.random().toString(36).substring(2),
    };
  }

  /**
   * Get transaction status
   */
  async getStatus(txId: string): Promise<{ status: number; confirmed: boolean }> {
    // All mock transactions are immediately confirmed
    return {
      status: 200,
      confirmed: this.storage.has(txId),
    };
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<string> {
    // Return sufficient balance for testing (1000 AR in winston)
    return '1000000000000000';
  }

  /**
   * Clear all stored transactions (test helper)
   */
  clear(): void {
    this.storage.clear();
    this.txCounter = 0;
  }

  /**
   * Get number of stored transactions (test helper)
   */
  getTransactionCount(): number {
    return this.storage.size;
  }

  /**
   * Check if transaction exists (test helper)
   */
  hasTransaction(txId: string): boolean {
    return this.storage.has(txId);
  }
}
