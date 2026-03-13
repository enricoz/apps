import crypto from 'crypto';
import { sign } from 'jsonwebtoken';

/**
 * Revolut Open Banking API Service
 *
 * Uses OAuth2 with JWT Client Assertion for authentication.
 * Supports both sandbox and production environments.
 *
 * Flow:
 * 1. Generate consent URL → redirect user to Revolut
 * 2. User authorizes → callback with authorization code
 * 3. Exchange code for access/refresh tokens (JWT assertion)
 * 4. Use access token for API calls
 * 5. Refresh when expired
 */

const REVOLUT_SANDBOX_URL = 'https://sandbox-oba.revolut.com';
const REVOLUT_PRODUCTION_URL = 'https://oba.revolut.com';
const REVOLUT_SANDBOX_AUTH_URL = 'https://sandbox-oba-auth.revolut.com';
const REVOLUT_PRODUCTION_AUTH_URL = 'https://oba-auth.revolut.com';

interface RevolutConfig {
  clientId: string;
  privateKeyPath?: string;
  privateKey?: string;
  isSandbox: boolean;
  redirectUri: string;
}

export interface RevolutTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  category: string;
  date: string;
  type: 'debit' | 'credit';
  merchant?: {
    name: string;
    category: string;
  };
  status: string;
}

export interface RevolutAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  state: string;
}

export class RevolutService {
  private config: RevolutConfig;
  private baseUrl: string;
  private authUrl: string;

  constructor() {
    this.config = {
      clientId: process.env.REVOLUT_CLIENT_ID || '',
      privateKeyPath: process.env.REVOLUT_PRIVATE_KEY_PATH,
      privateKey: process.env.REVOLUT_PRIVATE_KEY,
      isSandbox: process.env.REVOLUT_SANDBOX !== 'false',
      redirectUri: `${process.env.APP_URL || 'http://localhost:3000'}/api/revolut/callback`,
    };

    this.baseUrl = this.config.isSandbox ? REVOLUT_SANDBOX_URL : REVOLUT_PRODUCTION_URL;
    this.authUrl = this.config.isSandbox ? REVOLUT_SANDBOX_AUTH_URL : REVOLUT_PRODUCTION_AUTH_URL;
  }

  isConfigured(): boolean {
    return !!(this.config.clientId && (this.config.privateKeyPath || this.config.privateKey));
  }

  /**
   * Generate the consent/authorization URL for the user to connect their account
   */
  getConsentUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'accounts transactions',
      state,
    });

    return `${this.authUrl}/authorize?${params.toString()}`;
  }

  /**
   * Create JWT Client Assertion for token requests
   */
  private async createClientAssertion(): Promise<string> {
    let privateKey: string;

    if (this.config.privateKey) {
      privateKey = this.config.privateKey;
    } else if (this.config.privateKeyPath) {
      const fs = await import('fs');
      privateKey = fs.readFileSync(this.config.privateKeyPath, 'utf-8');
    } else {
      throw new Error('Revolut private key not configured');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.config.clientId,
      sub: this.config.clientId,
      aud: `${this.authUrl}/token`,
      iat: now,
      exp: now + 300, // 5 minutes
      jti: crypto.randomUUID(),
    };

    return sign(payload, privateKey, {
      algorithm: 'RS256',
      header: { alg: 'RS256', typ: 'JWT' },
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const assertion = await this.createClientAssertion();

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: assertion,
    });

    const response = await fetch(`${this.authUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Revolut token exchange failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh an expired access token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const assertion = await this.createClientAssertion();

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: assertion,
    });

    const response = await fetch(`${this.authUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Revolut token refresh failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Fetch accounts
   */
  async getAccounts(accessToken: string): Promise<RevolutAccount[]> {
    const response = await fetch(`${this.baseUrl}/accounts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('TOKEN_EXPIRED');
      throw new Error(`Revolut API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.Data?.Account || []).map((acc: any) => ({
      id: acc.AccountId,
      name: acc.Nickname || acc.Account?.[0]?.Name || 'Conto Revolut',
      balance: 0, // fetched separately
      currency: acc.Currency,
      state: acc.Status,
    }));
  }

  /**
   * Fetch account balances
   */
  async getBalances(accessToken: string, accountId: string): Promise<{ amount: number; currency: string }> {
    const response = await fetch(`${this.baseUrl}/accounts/${accountId}/balances`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('TOKEN_EXPIRED');
      throw new Error(`Revolut API error: ${response.status}`);
    }

    const data = await response.json();
    const balance = data.Data?.Balance?.[0];
    return {
      amount: balance ? parseFloat(balance.Amount?.Amount || '0') : 0,
      currency: balance?.Amount?.Currency || 'EUR',
    };
  }

  /**
   * Fetch transactions for an account
   */
  async getTransactions(
    accessToken: string,
    accountId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<RevolutTransaction[]> {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromBookingDateTime', fromDate);
    if (toDate) params.set('toBookingDateTime', toDate);

    const url = `${this.baseUrl}/accounts/${accountId}/transactions${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('TOKEN_EXPIRED');
      throw new Error(`Revolut API error: ${response.status}`);
    }

    const data = await response.json();
    const transactions = data.Data?.Transaction || [];

    return transactions.map((tx: any) => ({
      id: tx.TransactionId,
      amount: Math.abs(parseFloat(tx.Amount?.Amount || '0')),
      currency: tx.Amount?.Currency || 'EUR',
      description: tx.TransactionInformation || tx.MerchantDetails?.MerchantName || 'Transazione',
      reference: tx.TransactionReference || '',
      category: tx.TransactionMutability || 'other',
      date: tx.BookingDateTime || tx.ValueDateTime,
      type: parseFloat(tx.Amount?.Amount || '0') < 0 ? 'debit' : 'credit',
      merchant: tx.MerchantDetails ? {
        name: tx.MerchantDetails.MerchantName,
        category: tx.MerchantDetails.MerchantCategoryCode,
      } : undefined,
      status: tx.Status,
    }));
  }

  /**
   * Helper: ensure access token is valid, refresh if needed
   */
  async ensureValidToken(
    accessToken: string,
    refreshTokenStr: string,
    onRefresh: (newAccess: string, newRefresh: string) => Promise<void>
  ): Promise<string> {
    // Try the current token first
    try {
      await this.getAccounts(accessToken);
      return accessToken;
    } catch (error: any) {
      if (error.message !== 'TOKEN_EXPIRED') throw error;
    }

    // Token expired, refresh
    const tokens = await this.refreshToken(refreshTokenStr);
    await onRefresh(tokens.accessToken, tokens.refreshToken);
    return tokens.accessToken;
  }
}

// Singleton instance
let revolutService: RevolutService | null = null;

export function getRevolutService(): RevolutService {
  if (!revolutService) {
    revolutService = new RevolutService();
  }
  return revolutService;
}
