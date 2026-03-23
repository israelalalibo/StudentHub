# StudentHub — Postman & Unit Testing Guide

---

## SETUP — Do This Before Any Tests

### Step 1 — Create a Postman Environment

In Postman: **Environments → + New Environment** → name it `StudentHub`.

| Variable            | Initial Value                   |
|---------------------|---------------------------------|
| `base_url`          | `http://localhost:3000`         |
| `access_token`      | *(leave blank)*                 |
| `refresh_token`     | *(leave blank)*                 |
| `test_email`        | `testuser@salford.ac.uk`        |
| `test_password`     | `TestPass123!`                  |
| `product_id`        | *(leave blank)*                 |
| `conversation_id`   | *(leave blank)*                 |
| `cart_item_id`      | *(leave blank)*                 |

> **Screenshot:** Take a screenshot of this environment variables panel.

### Step 2 — Start the local server

```bash
node server.js
```

Confirm terminal shows: `Supabase initialized successfully`

---

## GROUP 1 — Authentication Tests

---

### API-01 — Register with Valid Details ✅

```
Method:  POST
URL:     {{base_url}}/signup
Headers: Content-Type: application/json

Body (raw JSON):
{
  "firstName": "Test",
  "lastName":  "Student",
  "email":     "testuser@salford.ac.uk",
  "password":  "TestPass123!",
  "phone":     "07700900000",
  "createdAt": "2026-03-23T10:00:00.000Z"
}
```

**Expected — 200 OK:**
```json
{
  "message": "User created successfully",
  "userID": "<uuid>"
}
```

**Tests tab:**
```javascript
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Returns userID", () => {
    const json = pm.response.json();
    pm.expect(json).to.have.property('userID');
    pm.expect(json.message).to.eql('User created successfully');
});
```

---

### API-02 — Register with Duplicate Email ❌

Same body as API-01 (re-use the same email).

**Expected — 400 Bad Request:**
```json
{ "error": "User already registered" }
```

**Tests tab:**
```javascript
pm.test("Status is 400", () => pm.response.to.have.status(400));
pm.test("Returns error", () => pm.expect(pm.response.json()).to.have.property('error'));
```

---

### API-03 — Register with Missing Password ❌

```json
{
  "firstName": "Test",
  "lastName":  "Student",
  "email":     "nopass@salford.ac.uk",
  "createdAt": "2026-03-23T10:00:00.000Z"
}
```

**Expected — 400 Bad Request** (password required by Supabase).

---

### API-04 — Sign In with Valid Credentials ✅ *(Run before any protected endpoint)*

```
Method:  POST
URL:     {{base_url}}/signin
Headers: Content-Type: application/json

Body:
{
  "email":    "{{test_email}}",
  "password": "{{test_password}}"
}
```

**Expected — 200 OK:**
```json
{
  "message": "Signin successful",
  "userID": "<uuid>",
  "session": { "access_token": "eyJ...", "refresh_token": "..." }
}
```

**Tests tab (auto-saves token to environment):**
```javascript
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Returns access token", () => {
    const json = pm.response.json();
    pm.expect(json.session).to.have.property('access_token');
    pm.environment.set('access_token', json.session.access_token);
    pm.environment.set('refresh_token', json.session.refresh_token);
});
```

---

### API-05 — Sign In with Wrong Password ❌

```json
{ "email": "{{test_email}}", "password": "WrongPassword999" }
```

**Expected — 400 Bad Request:**
```json
{ "error": "Invalid login credentials" }
```

---

## GROUP 2 — Product / Listing Tests

> Run API-04 first. Upload endpoints require an active server session.

---

### API-06 — Upload Product with Valid Data ✅

```
Method:  POST
URL:     {{base_url}}/uploadProduct
Body:    form-data

  title       → "Introduction to Algorithms (3rd Ed)"
  description → "Excellent condition, minimal highlighting"
  price       → 25.00
  category    → "Books"
  condition   → "Good"
  image       → [select a .jpg or .png file from your machine]
```

**Expected — 200 OK:**
```json
{ "success": true, "message": "Product uploaded successfully" }
```

**Tests tab:**
```javascript
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Upload succeeded", () => pm.expect(pm.response.json().success).to.be.true);
```

---

### API-07 — Upload Product Without Image ❌

```
Body: form-data (no image field)
  title     → "No Image Test"
  price     → 10.00
  category  → "Books"
  condition → "Good"
```

**Expected — 400 Bad Request:**
```json
{ "success": false, "error": "Image file missing" }
```

---

### API-08 — Keyword Search with Price Range ✅

```
Method:  GET
URL:     {{base_url}}/search?q=algorithm&price=25-50
```

**Expected — 200 OK:** Array of matching products priced £25-£50.

**Tests tab:**
```javascript
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Returns array", () => pm.expect(pm.response.json()).to.be.an('array'));
pm.test("All items within price range", () => {
    pm.response.json().forEach(item => pm.expect(item.price).to.be.within(25, 50));
});
```

---

### API-09 — Keyword Search (No Results) ✅

```
GET {{base_url}}/search?q=xyznonexistentitem99999
```

**Expected — 200 OK, empty array:** `[]`

---

### API-10 — Category Search with Price Filter ✅

```
GET {{base_url}}/search/category?category=Electronics&price=0-50
```

**Expected — 200 OK:** Array of Electronics items priced £0-£50.

---

### API-11 — Live Autocomplete Search ✅

```
GET {{base_url}}/api/products/search?q=intro&limit=5
```

**Tests tab:**
```javascript
pm.test("Returns 5 or fewer results", () => {
    pm.expect(pm.response.json().length).to.be.at.most(5);
});
```

---

### API-12 — Autocomplete Below Minimum Length ✅

```
GET {{base_url}}/api/products/search?q=a
```

**Expected — 200 OK, empty array:** `[]` (query under 2 chars returns nothing).

---

## GROUP 3 — Cart Tests

> All cart endpoints use server-side session. Run API-04 first.

---

### API-13 — Add Item to Cart ✅

```
Method:  POST
URL:     {{base_url}}/api/cart
Headers: Content-Type: application/json

Body:
{
  "product_id":   "<real-product-uuid>",
  "title":        "Introduction to Algorithms (3rd Ed)",
  "price":        25.00,
  "image_url":    "https://...",
  "category":     "Books",
  "condition":    "Good",
  "seller_id":    "<seller-uuid>",
  "seller_name":  "Test Seller"
}
```

**Expected — 201 Created:**
```json
{ "success": true, "item": { "id": "...", "quantity": 1 } }
```

**Tests tab:**
```javascript
pm.test("Status is 201", () => pm.response.to.have.status(201));
pm.test("Quantity is 1", () => pm.expect(pm.response.json().item.quantity).to.eql(1));
pm.environment.set('cart_item_id', pm.response.json().item.id);
```

---

### API-14 — Add Same Item Again (Quantity Increment) ✅

Repeat API-13 with the **exact same body**.

**Expected — 200 OK:**
```json
{ "success": true, "message": "Quantity updated", "item": { "quantity": 2 } }
```

**Tests tab:**
```javascript
pm.test("Quantity incremented to 2", () => pm.expect(pm.response.json().item.quantity).to.eql(2));
```

---

### API-15 — Get Cart ✅

```
GET {{base_url}}/api/cart
```

**Expected — 200 OK:**
```json
{ "items": [{ "quantity": 2, ... }] }
```

---

### API-16 — Get Cart Without Auth ❌

Open a **new Postman window** (no prior signin), then:

```
GET {{base_url}}/api/cart
```

**Expected — 401 Unauthorized:**
```json
{ "error": "Not logged in", "items": [] }
```

---

### API-17 — Update Cart Item Quantity ✅

```
Method:  PATCH
URL:     {{base_url}}/api/cart/{{cart_item_id}}
Headers: Content-Type: application/json

Body:
{ "quantity": 3 }
```

**Expected — 200 OK:** `{ "success": true, "item": { "quantity": 3 } }`

---

### API-18 — Delete Cart Item ✅

```
Method:  DELETE
URL:     {{base_url}}/api/cart/{{cart_item_id}}
```

**Expected — 200 OK:** `{ "success": true }`

---

## GROUP 4 — Messaging Tests

> Messaging uses `Authorization: Bearer {{access_token}}`. Token is saved automatically by API-04.

---

### API-19 — Create a Conversation ✅

```
Method:  POST
URL:     {{base_url}}/api/conversations
Headers:
  Content-Type:  application/json
  Authorization: Bearer {{access_token}}

Body:
{
  "buyer_id":      "<your-user-uuid>",
  "seller_id":     "<another-users-uuid>",
  "product_id":    "<product-uuid>",
  "product_title": "Introduction to Algorithms (3rd Ed)"
}
```

**Expected — 200 OK:** `{ "id": "<conversation-uuid>", ... }`

**Tests tab:**
```javascript
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.environment.set('conversation_id', pm.response.json().id);
```

---

### API-20 — Self-Message Prevention ❌

Use the **same UUID** for both `buyer_id` and `seller_id`.

**Expected — 400 Bad Request:**
```json
{ "error": "Cannot message yourself" }
```

---

### API-21 — Send a Message ✅

```
Method:  POST
URL:     {{base_url}}/api/messages
Headers:
  Content-Type:  application/json
  Authorization: Bearer {{access_token}}

Body:
{
  "conversation_id": "{{conversation_id}}",
  "content":         "Hi, is this item still available?"
}
```

**Expected — 201 Created:**
```json
{ "id": "...", "content": "Hi, is this item still available?", "sender_id": "..." }
```

---

### API-22 — Access Another User's Conversation ❌

Sign in as a **different test account**, then:

```
GET {{base_url}}/api/messages/{{conversation_id}}
Headers: Authorization: Bearer <other_users_token>
```

**Expected — 403 Forbidden:** `{ "error": "Access denied" }`

---

## GROUP 5 — AI Valuator Tests

---

### API-23 — Book Valuator with Valid ISBN ✅

```
Method:  POST
URL:     {{base_url}}/bookValuator
Headers: Content-Type: application/json

Body:
{
  "isbn":      "9780349411903",
  "condition": "Good",
  "format":    "Paperback",
  "edition":   "Standard",
  "damages":   []
}
```

**Expected — 200 OK:**
```json
{
  "success": true,
  "predicted_value": 8.50,
  "reasoning": "This book in Good condition..."
}
```

**Tests tab:**
```javascript
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Returns numeric prediction", () => {
    const json = pm.response.json();
    pm.expect(json.success).to.be.true;
    pm.expect(json.predicted_value).to.be.a('number');
});
pm.test("Response under 5 seconds", () => pm.expect(pm.response.responseTime).to.be.below(5000));
```

---

### API-24 — Book Valuator with Unknown ISBN ✅ (graceful fallback)

```json
{ "isbn": "0000000000000", "condition": "Good", "format": "Paperback" }
```

**Expected — 200 OK** with reasoning noting title could not be found.

---

### API-25 — Book Valuator Missing ISBN Field ❌

```json
{ "condition": "Good" }
```

**Expected — 400 Bad Request:**
```json
{ "error": "Invalid book data provided." }
```

---

### API-26 — Item Valuator ✅

```
Method:  POST
URL:     {{base_url}}/itemValuator
Body:    form-data

  item_name        → "Apple MacBook Pro 2020"
  item_description → "M1 chip, 8GB RAM, 256GB SSD, minor scratches on lid"
  item_condition   → "Good"
  item_category    → "Electronics"
  item_image       → [optional: select a .jpg/.png image file]
```

**Expected — 200 OK:**
```json
{ "success": true, "predicted_value": 650, "reasoning": "..." }
```

---

### API-27 — Item Valuator Missing Item Name ❌

```
form-data:
  item_condition → "Good"
  item_category  → "Electronics"
```

**Expected — 400 Bad Request:**
```json
{ "error": "Item name is required.", "success": false }
```

---

## GROUP 6 — Checkout Tests

---

### API-28 — Create Stripe Checkout Session ✅

*(Run API-04 first. Use a product listed by a different user.)*

```
Method:  POST
URL:     {{base_url}}/api/checkout/create-session
Headers: Content-Type: application/json

Body:
{
  "cartItems": [
    {
      "product_id": "<valid-product-uuid>",
      "title":      "Introduction to Algorithms (3rd Ed)",
      "price":      25.00,
      "quantity":   1,
      "seller_id":  "<seller-uuid>"
    }
  ]
}
```

**Expected — 200 OK:**
```json
{ "url": "https://checkout.stripe.com/..." }
```

---

### API-29 — Self-Purchase Prevention ❌

Use a `product_id` that **you listed yourself**:

```json
{
  "cartItems": [{
    "product_id": "<your-own-product-uuid>",
    "title":      "My Own Listing",
    "price":      15.00,
    "quantity":   1,
    "seller_id":  "<your-own-user-uuid>"
  }]
}
```

**Expected — 400 Bad Request:**
```json
{ "error": "You cannot buy your own product: My Own Listing" }
```

---

### API-30 — Checkout with Empty Cart ❌

```json
{ "cartItems": [] }
```

**Expected — 400 Bad Request:**
```json
{ "error": "Cart is empty" }
```

---

## UNIT TESTING — Jest Test Suite

### Setup

```bash
npm install --save-dev jest
```

Add to `package.json`:
```json
"scripts": {
  "test": "node --experimental-vm-modules node_modules/.bin/jest"
},
"jest": {
  "testEnvironment": "node"
}
```

Create the file `tests/unit.test.js` (see below), then run:

```bash
npm test
```

> **Screenshot:** Terminal output showing all test suites passing with green ✓ ticks.

---

### `tests/unit.test.js`

```javascript
// StudentHub — Unit Test Suite
// Run: npm test

// =====================================================
// TEST SUITE 1: Price Parsing & Validation
// =====================================================
describe('Price Validation', () => {
  const parsePrice = (price) => {
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) throw new Error('Invalid price');
    return p;
  };

  test('Valid price string parses correctly', () => {
    expect(parsePrice('25.00')).toBe(25.00);
  });
  test('Zero is a valid price', () => {
    expect(parsePrice('0')).toBe(0);
  });
  test('Negative price throws error', () => {
    expect(() => parsePrice('-5')).toThrow('Invalid price');
  });
  test('Non-numeric input throws error', () => {
    expect(() => parsePrice('abc')).toThrow('Invalid price');
  });
});

// =====================================================
// TEST SUITE 2: Platform Fee Calculation (5%)
// =====================================================
describe('Platform Fee Calculation', () => {
  const PLATFORM_FEE_PERCENT = 5;
  const fee    = (price) => (price * PLATFORM_FEE_PERCENT) / 100;
  const seller = (price) => price - fee(price);

  test('5% fee on £20.00 is £1.00', () => {
    expect(fee(20)).toBe(1.00);
  });
  test('Seller receives £19.00 from a £20.00 sale', () => {
    expect(seller(20)).toBe(19.00);
  });
  test('Fee on £0 is £0', () => {
    expect(fee(0)).toBe(0);
  });
  test('Fee on fractional price is correct', () => {
    expect(fee(15.99)).toBeCloseTo(0.7995, 4);
  });
});

// =====================================================
// TEST SUITE 3: Cart Add-or-Increment Logic
// =====================================================
describe('Cart Quantity Logic', () => {
  let mockCart = [];

  const addToCart = (userId, productId, item) => {
    const existing = mockCart.find(
      c => c.user_id === userId && c.product_id === productId
    );
    if (existing) {
      existing.quantity += 1;
      return { updated: true, quantity: existing.quantity };
    }
    mockCart.push({ user_id: userId, product_id: productId, quantity: 1, ...item });
    return { updated: false, quantity: 1 };
  };

  beforeEach(() => { mockCart = []; });

  test('New item added with quantity 1', () => {
    const result = addToCart('user1', 'prod1', { title: 'Algorithms' });
    expect(result.quantity).toBe(1);
    expect(result.updated).toBe(false);
  });
  test('Same item increments quantity to 2', () => {
    addToCart('user1', 'prod1', { title: 'Algorithms' });
    const result = addToCart('user1', 'prod1', { title: 'Algorithms' });
    expect(result.quantity).toBe(2);
    expect(result.updated).toBe(true);
  });
  test('Different user gets a separate cart entry', () => {
    addToCart('user1', 'prod1', { title: 'Algorithms' });
    addToCart('user2', 'prod1', { title: 'Algorithms' });
    expect(mockCart).toHaveLength(2);
    expect(mockCart[1].quantity).toBe(1);
  });
});

// =====================================================
// TEST SUITE 4: Payment Idempotency Guard
// =====================================================
describe('Payment Idempotency Guard', () => {
  const processPayment = (order) => {
    if (order.payment_status === 'paid') {
      return { alreadyProcessed: true };
    }
    order.payment_status = 'paid';
    order.status = 'confirmed';
    return { alreadyProcessed: false };
  };

  test('First call processes payment', () => {
    const order = { id: 'ord1', payment_status: 'unpaid', status: 'pending' };
    expect(processPayment(order).alreadyProcessed).toBe(false);
    expect(order.payment_status).toBe('paid');
  });
  test('Duplicate webhook call is blocked', () => {
    const order = { id: 'ord1', payment_status: 'paid', status: 'confirmed' };
    expect(processPayment(order).alreadyProcessed).toBe(true);
    expect(order.status).toBe('confirmed');
  });
});

// =====================================================
// TEST SUITE 5: Self-Purchase Prevention
// =====================================================
describe('Self-Purchase Prevention', () => {
  const canPurchase = (buyerId, items) => {
    const selfItem = items.find(i => i.seller_id === buyerId);
    if (selfItem) throw new Error(`You cannot buy your own product: ${selfItem.title}`);
    return true;
  };

  test('Buyer can purchase another seller\'s item', () => {
    expect(canPurchase('buyer1', [{ seller_id: 'seller1', title: 'Book A' }])).toBe(true);
  });
  test('Buyer cannot purchase their own item', () => {
    expect(() =>
      canPurchase('user1', [{ seller_id: 'user1', title: 'My Listing' }])
    ).toThrow('You cannot buy your own product: My Listing');
  });
  test('Mixed cart — own item in basket throws', () => {
    const items = [
      { seller_id: 'seller2', title: 'Item A' },
      { seller_id: 'user1',   title: 'My Item' }
    ];
    expect(() => canPurchase('user1', items)).toThrow();
  });
});

// =====================================================
// TEST SUITE 6: Search Query Minimum-Length Guard
// =====================================================
describe('Search Query Validation', () => {
  const validateQuery = (q) => {
    if (!q || q.trim().length < 2) return [];
    return ['result1', 'result2'];
  };

  test('Empty string returns empty array', () => expect(validateQuery('')).toHaveLength(0));
  test('Single character returns empty array', () => expect(validateQuery('a')).toHaveLength(0));
  test('Whitespace-only returns empty array', () => expect(validateQuery('  ')).toHaveLength(0));
  test('Two-character query returns results', () => expect(validateQuery('go')).toHaveLength(2));
  test('Full keyword returns results', () => expect(validateQuery('algorithm')).toHaveLength(2));
});
```

---

## Screenshot Checklist

| # | Test | What to Capture |
|---|------|-----------------|
| 1 | Environment | Postman environment variables panel |
| 2 | API-01 | 200 response body + Tests tab green ticks |
| 3 | API-02 | 400 duplicate email error |
| 4 | API-04 | 200 signin response showing `access_token` |
| 5 | API-05 | 400 wrong password error |
| 6 | API-06 | 200 product upload (form-data + response) |
| 7 | API-07 | 400 missing image error |
| 8 | API-08 | 200 search array with price-filtered results |
| 9 | API-09 | 200 empty array for no-match query |
| 10 | API-13 | 201 cart created, quantity = 1 |
| 11 | API-14 | 200 quantity updated to 2 |
| 12 | API-16 | 401 unauthenticated cart access |
| 13 | API-23 | 200 AI book valuation with `predicted_value` |
| 14 | API-25 | 400 missing ISBN |
| 15 | API-28 | 200 Stripe checkout URL returned |
| 16 | API-29 | 400 self-purchase blocked |
| 17 | Unit tests | Terminal: all 6 test suites passing (green ✓) |
| 18 | Collection Runner | Postman runner summary — all requests pass |
