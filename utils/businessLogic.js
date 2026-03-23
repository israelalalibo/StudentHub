// Pure business logic functions extracted for unit testing.
// These mirror the logic embedded in server.js so that the core
// rules can be verified in isolation without Express or Supabase.

export const PLATFORM_FEE_PERCENT = 5;

// ---------------------------------------------------------------------------
// Price Validation
// ---------------------------------------------------------------------------

/**
 * Parse and validate a price value from any input type.
 * Throws if the value cannot be converted to a non-negative finite number.
 * @param {*} value
 * @returns {number}
 */
export function parsePrice(value) {
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) {
    throw new Error(`Invalid price: "${value}" is not a number`);
  }
  if (num < 0) {
    throw new Error(`Invalid price: "${value}" must not be negative`);
  }
  return num;
}

// ---------------------------------------------------------------------------
// Platform Fee Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the platform fee (5%) for a given item price.
 * @param {number} price
 * @returns {number}
 */
export function calculatePlatformFee(price) {
  return (price * PLATFORM_FEE_PERCENT) / 100;
}

/**
 * Calculate the net amount paid to the seller after the platform fee.
 * @param {number} price
 * @returns {number}
 */
export function calculateSellerPayout(price) {
  return price - calculatePlatformFee(price);
}

// ---------------------------------------------------------------------------
// Cart Quantity Logic
// ---------------------------------------------------------------------------

/**
 * Determine the resolved quantity when adding a product to the cart.
 * If an existing cart row is provided the quantity is incremented by 1.
 * Otherwise the item is treated as new and quantity starts at 1.
 * @param {{ quantity: number } | null} existingRow
 * @returns {number}
 */
export function resolveCartQuantity(existingRow) {
  if (existingRow) {
    return existingRow.quantity + 1;
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Payment Idempotency Guard
// ---------------------------------------------------------------------------

/**
 * Return true if the order has already been processed as paid,
 * preventing double-fulfilment on duplicate webhook delivery.
 * @param {{ status: string } | null | undefined} order
 * @returns {boolean}
 */
export function isAlreadyPaid(order) {
  return order?.status === 'paid';
}

// ---------------------------------------------------------------------------
// Self-Purchase Prevention
// ---------------------------------------------------------------------------

/**
 * Return true if any item in the cart is owned by the current user.
 * Guards against a buyer purchasing their own listing.
 * @param {Array<{ seller_id: string }>} cartItems
 * @param {string} userId
 * @returns {boolean}
 */
export function hasSelfPurchase(cartItems, userId) {
  return cartItems.some((item) => item.seller_id === userId);
}

// ---------------------------------------------------------------------------
// Search Query Validation
// ---------------------------------------------------------------------------

/**
 * Sanitise and validate a search query string.
 * Returns an empty string for blank or single-character inputs,
 * and a trimmed, lower-cased string for valid queries.
 * @param {*} q
 * @returns {string}
 */
export function validateSearchQuery(q) {
  if (q === null || q === undefined) return '';
  const trimmed = String(q).trim();
  if (trimmed.length <= 1) return '';
  return trimmed.toLowerCase();
}
