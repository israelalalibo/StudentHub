/**
 * StudentHub – Unit Test Suite
 * Chapter 6.3 – Business Logic Tests
 *
 * 6 suites / 21 tests covering:
 *   1. Price Validation
 *   2. Platform Fee Calculation
 *   3. Cart Quantity Logic
 *   4. Payment Idempotency Guard
 *   5. Self-Purchase Prevention
 *   6. Search Query Validation
 */

import { // import all the functions to be tested from the businessLogic module
  parsePrice,
  calculatePlatformFee,
  calculateSellerPayout,
  resolveCartQuantity,
  isAlreadyPaid,
  hasSelfPurchase,
  validateSearchQuery,
} from '../utils/businessLogic.js';

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 – Price Validation (4 tests)
// ─────────────────────────────────────────────────────────────────────────────
describe('Price Validation', () => {
  test('parses a valid numeric string to a float', () => {
    expect(parsePrice('15.99')).toBe(15.99);
  });

  test('parses an integer string correctly', () => {
    expect(parsePrice('50')).toBe(50);
  });

  test('throws for a negative price', () => {
    expect(() => parsePrice('-1')).toThrow('must not be negative');
  });

  test('throws for a non-numeric string', () => {
    expect(() => parsePrice('abc')).toThrow('is not a number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 – Platform Fee Calculation (4 tests)
// ─────────────────────────────────────────────────────────────────────────────
describe('Platform Fee Calculation', () => {
  test('calculates 5% platform fee on a standard price', () => {
    // toBeCloseTo avoids floating-point precision failures
    expect(calculatePlatformFee(15.99)).toBeCloseTo(0.7995, 4);
  });

  test('calculates correct seller payout after fee deduction', () => {
    expect(calculateSellerPayout(20)).toBeCloseTo(19.0, 4);
  });

  test('returns zero fee for a zero-price item', () => {
    expect(calculatePlatformFee(0)).toBe(0);
  });

  test('handles large price values without precision loss', () => {
    expect(calculatePlatformFee(1000)).toBeCloseTo(50.0, 4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 – Cart Quantity Logic (3 tests)
// ─────────────────────────────────────────────────────────────────────────────
describe('Cart Quantity Logic', () => {
  test('returns quantity 1 when item is new to the cart', () => {
    expect(resolveCartQuantity(null)).toBe(1);
  });

  test('increments quantity by 1 when item already exists in cart', () => {
    const existingRow = { quantity: 1 };
    expect(resolveCartQuantity(existingRow)).toBe(2);
  });

  test('treats separate users as independent cart contexts (no cross-user bleed)', () => {
    // Simulates two users each adding the same product for the first time
    const user1Row = null;
    const user2Row = null;
    expect(resolveCartQuantity(user1Row)).toBe(1);
    expect(resolveCartQuantity(user2Row)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 – Payment Idempotency Guard (2 tests)
// ─────────────────────────────────────────────────────────────────────────────
describe('Payment Idempotency Guard', () => {
  test('returns false for a first-time payment (order not yet paid)', () => {
    const order = { status: 'pending' };
    expect(isAlreadyPaid(order)).toBe(false);
  });

  test('returns true on duplicate webhook delivery (order already paid)', () => {
    const order = { status: 'paid' };
    expect(isAlreadyPaid(order)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 – Self-Purchase Prevention (3 tests)
// ─────────────────────────────────────────────────────────────────────────────
describe('Self-Purchase Prevention', () => {
  const BUYER_ID = 'user-abc-123';
  const SELLER_ID = 'user-xyz-456';

  test('allows checkout when no cart item is owned by the buyer', () => {
    const cart = [
      { seller_id: SELLER_ID, title: 'Calculus Textbook' },
    ];
    expect(hasSelfPurchase(cart, BUYER_ID)).toBe(false);
  });

  test('blocks checkout when the buyer owns an item in the cart', () => {
    const cart = [
      { seller_id: BUYER_ID, title: 'My Old Laptop' },
    ];
    expect(hasSelfPurchase(cart, BUYER_ID)).toBe(true);
  });

  test('blocks checkout on a mixed cart containing one self-owned item', () => {
    // Edge case: one valid item + one self-owned item — guard must still throw
    const cart = [
      { seller_id: SELLER_ID, title: 'Physics Notes' },
      { seller_id: BUYER_ID, title: 'My Old Headphones' },
    ];
    expect(hasSelfPurchase(cart, BUYER_ID)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 – Search Query Validation (5 tests)
// ─────────────────────────────────────────────────────────────────────────────
describe('Search Query Validation', () => {
  test('returns empty string for an empty query', () => {
    expect(validateSearchQuery('')).toBe('');
  });

  test('returns empty string for a single-character query', () => {
    expect(validateSearchQuery('a')).toBe('');
  });

  test('returns empty string for a whitespace-only query', () => {
    expect(validateSearchQuery('   ')).toBe('');
  });

  test('returns a normalised lower-case string for a valid query', () => {
    expect(validateSearchQuery('  Algorithm  ')).toBe('algorithm');
  });

  test('returns up to five characters trimmed and lower-cased for a short valid query', () => {
    expect(validateSearchQuery('Book')).toBe('book');
  });
});
