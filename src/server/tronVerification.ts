/**
 * TRON USDT (TRC20) Verification Service
 * Supports querying TronScan / TronGrid public APIs to verify on-chain USDT transfers,
 * recipient address match, amount, and status, with admin fallback approval.
 */

export interface VerificationResult {
  verified: boolean;
  amount?: number;
  recipient?: string;
  confirmed?: boolean;
  timestamp?: number;
  error?: string;
  requiresAdminReview?: boolean;
}

export async function verifyTronTransaction(
  txHash: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<VerificationResult> {
  const cleanHash = txHash.trim();

  // Basic regex validation for TRON transaction hash (64 hex characters)
  if (!/^[a-fA-F0-9]{64}$/.test(cleanHash)) {
    return {
      verified: false,
      error: 'Invalid TRON transaction hash format. Must be 64 hexadecimal characters.',
    };
  }

  try {
    // 1. Try TronScan API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`https://apilist.tronscanapi.com/api/transaction-info?hash=${cleanHash}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZainAI-Verifier/1.0)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();

      // Check if transaction exists
      if (!data || !data.hash) {
        return {
          verified: false,
          requiresAdminReview: true,
          error: 'Transaction not found on TronScan yet. It may still be propagating through the network.',
        };
      }

      // Check if transaction confirmed
      const isConfirmed = data.confirmed === true || data.contractRet === 'SUCCESS';
      if (!isConfirmed) {
        return {
          verified: false,
          requiresAdminReview: true,
          error: 'Transaction is still unconfirmed or failed on the TRON network.',
        };
      }

      // TRC20 transfers are under trc20TransferInfo
      let trc20Transfers = data.trc20TransferInfo || [];
      if (!Array.isArray(trc20Transfers) || trc20Transfers.length === 0) {
        // Look in internal or trigger contract data
        if (data.trigger_info && data.trigger_info.parameter) {
          const to = data.trigger_info.parameter._to;
          const val = data.trigger_info.parameter._value;
          if (to && val) {
            trc20Transfers = [{
              to_address: to,
              amount_str: val,
              decimals: 6,
            }];
          }
        }
      }

      // Search matching transfer
      const matched = trc20Transfers.find((t: any) => {
        const dest = (t.to_address || '').toLowerCase();
        const expected = expectedRecipient.toLowerCase();
        return dest === expected;
      });

      if (matched) {
        // USDT TRC20 has 6 decimals
        const decimals = matched.decimals || 6;
        const actualAmount = parseFloat(matched.amount_str || '0') / Math.pow(10, decimals);

        // Allow 0.5 USDT tolerance for gas fee differences if user sent slightly more/less
        if (actualAmount >= expectedAmount - 0.5) {
          return {
            verified: true,
            amount: actualAmount,
            recipient: matched.to_address,
            confirmed: true,
            timestamp: data.timestamp,
          };
        } else {
          return {
            verified: false,
            amount: actualAmount,
            requiresAdminReview: true,
            error: `Transfer found, but amount (${actualAmount} USDT) is less than required (${expectedAmount} USDT).`,
          };
        }
      }

      // If transfer found on network but not directly parsed, flag for admin review
      return {
        verified: false,
        requiresAdminReview: true,
        error: `Transaction confirmed on TRON, but USDT recipient did not directly match ${expectedRecipient}. Submitted for Admin Review.`,
      };
    }
  } catch (err: any) {
    // If public API fails (e.g. rate limit or network offline), don't reject the user's order!
    // Instead flag for immediate admin review so the admin can verify on Tronscan explorer manually.
    console.warn('TronScan API verification timed out or returned error:', err?.message || err);
  }

  // Fallback: Valid hash format accepted into pending queue for admin confirmation
  return {
    verified: false,
    requiresAdminReview: true,
    error: 'Blockchain API network check busy. Transaction queued for quick manual confirmation by Admin.',
  };
}
