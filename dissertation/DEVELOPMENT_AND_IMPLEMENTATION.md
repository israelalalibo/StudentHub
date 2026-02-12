# Chapter 4: Development and Implementation

## 4.1 Introduction

This chapter describes how the StudentHub e-commerce platform specified in Chapter 3 was implemented to meet the identified functional and non-functional requirements. The implementation followed the three-tier architecture and technology stack defined in the design phase, with development conducted iteratively and validated against the requirements (Sommerville, 2016). The chapter presents the implementation approach, the realisation of core modules using appropriate data structures and algorithms, the main problems encountered during development and the solutions adopted, and the techniques used to verify that the system meets its requirements.

---

## 4.2 Implementation Approach and Development Environment

### 4.2.1 Development Methodology

Development was carried out using an iterative, feature-driven approach aligned with the Agile principles referenced in the specification phase. Features were implemented in vertical slices: each slice included front-end views, server-side routes and business logic, and database interactions, so that end-to-end flows could be tested early (Cohn, 2004). Priority was given to the “Must have” functional requirements (FR01–FR06) before extending to “Should have” (FR07–FR10, FR13) and “Could have” (FR11–FR12) features.

### 4.2.2 Technology Stack and Tooling

The runtime and tooling choices from the design were adhered to in implementation:

- **Runtime**: Node.js (v18+) with ES modules (`"type": "module"` in `package.json`) to support modern JavaScript and clear module boundaries.
- **Web framework**: Express.js 5.x for routing, middleware, and REST API implementation (Fielding, 2000).
- **Database and auth**: Supabase (PostgreSQL) accessed via `@supabase/supabase-js`. Two distinct client instances were used: one for authentication operations (`supabaseAuth`) and one for data operations (`supabaseAdmin`), as discussed in Section 4.5.1.
- **Payments**: Stripe SDK for creating Checkout Sessions and verifying payments, with a configurable platform fee (e.g. 5%).
- **File handling**: Multer for multipart uploads—disk storage for product images (with `/tmp` in serverless environments) and memory storage for profile pictures, with type and size validation.
- **External APIs**: Google Books API for ISBN-based book metadata and Google Gemini API for the AI Book Valuator (FR11), with API keys loaded from environment variables at request time to support serverless deployment.

Configuration is externalised via environment variables (e.g. `ini.env` locally and platform-specific env vars in production), supporting the non-functional requirement for maintainability and secure handling of secrets (NFR10).

---

## 4.3 Implementation of Core Modules

### 4.3.1 Authentication and Session Management

Authentication implements FR01 (user registration) and FR02 (user authentication) using Supabase Auth. Registration (`POST /signup`) creates the user in Supabase Auth with `createUser` (admin API) and inserts a corresponding row into the `student` table with the same `id`, ensuring referential integrity with the ER design (Codd, 1970). Sign-in (`POST /signin`) uses `signInWithPassword`; on success, the server returns the user identifier and session tokens (access and refresh) to the client. The client stores these tokens and, for protected API calls, either sends them in the `Authorization` header or the server restores the session via `POST /api/restore-session` so that `supabase.auth.getUser()` can identify the current user on subsequent requests.

Session verification is centralised in a consistent pattern across protected endpoints: each handler calls `await supabase.auth.getUser()` and returns HTTP 401 if no user is present. This satisfies NFR05 (secure session management) and ensures that only authenticated users access cart, profile, orders, and messaging APIs.

### 4.3.2 Product Listing and Search

Product listing (FR03) is implemented by `POST /uploadProduct`. The handler accepts multipart form data (title, description, price, category, condition, image). The image is validated, stored in Supabase Storage under a namespaced path (`{seller_id}/{timestamp}.{ext}`), and the public URL is stored with the product. A single row is inserted into `ProductTable` with `seller_id` set from the authenticated user. This aligns with the schema and keeps the application tier responsible for access control and storage orchestration (Eckerson, 1995).

Search (FR04) is implemented at two levels:

1. **Keyword and category search**: `GET /search` and `GET /search/category` use Supabase queries with `ilike` on `title` (and `description` for keyword) and optional category and price-range filters. Price bands (e.g. 0–25, 25–50, 50–100, 100–200, 200+) are applied with `.gte()` and `.lte()` on the `price` column. Results are enriched with seller names by querying the `student` table per product (or in a batch) to present a unified result set to the client.
2. **Live search**: `GET /api/products/search` supports autocomplete-style search with a minimum query length (e.g. 2 characters), `ilike` on both `title` and `description`, optional category filter, and a configurable limit. It returns a compact payload (e.g. `id`, `title`, `price`, `image_url`, `category`) to keep response size small and support NFR02 (API response time).

Featured products (`GET /api/featured-products`) implement a simple ranking algorithm: products are fetched with seller info, review counts are aggregated from the `reviews` table into a map keyed by `product_id`, and the list is sorted by review count descending, then by `created_at` descending. The top N items are returned. This provides a deterministic, reproducible ordering that favours well-reviewed and recent listings.

### 4.3.3 Shopping Cart

The shopping cart (FR05) is implemented as a persistent store in the `cart` table, keyed by `user_id` and `product_id`. Data structures and operations are as follows:

- **Add to cart** (`POST /api/cart`): The handler checks for an existing row with the same `user_id` and `product_id`. If found, it updates `quantity` by incrementing; otherwise it inserts a new row with quantity 1 and denormalised fields (title, price, image_url, category, condition, seller_id, seller_name) to avoid repeated joins when displaying the cart and building the checkout payload.
- **Update quantity** (`PATCH /api/cart/:itemId`): If the new quantity is ≤ 0, the row is deleted; otherwise the `quantity` column is updated. Ownership is enforced by restricting updates to rows where `user_id` matches the authenticated user.
- **Remove item** (`DELETE /api/cart/:itemId`) and **clear cart** (`DELETE /api/cart`): Delete operations are scoped by `user_id` so users can only modify their own cart.

Cart count for the UI badge is provided by `GET /api/cart/count`, which sums `quantity` over the user’s cart rows. This design keeps the cart consistent across sessions and devices and supports the “persistent cart” requirement (FR05).

### 4.3.4 Checkout and Payment (Stripe)

Secure checkout (FR06) and payment security (NFR06) are implemented using Stripe Checkout and a two-phase flow: session creation and payment verification.

**Phase 1 – Create session** (`POST /api/checkout/create-session`):

1. **Input**: The client sends the current cart items (e.g. `product_id`, `title`, `price`, `quantity`, `seller_id`, etc.).
2. **Validation and normalisation**: For each cart item, the server resolves the product via `ProductTable`—either by UUID `product_id` or by `seller_id` and `title`—to obtain the current price and metadata and to prevent buying one’s own listing.
3. **Order creation**: A single row is inserted into `orders` (buyer_id, subtotal, platform_fee, total_amount, status: `pending`, payment_status: `unpaid`, buyer_email, buyer_name). Corresponding rows are inserted into `order_items` (order_id, product_id, seller_id, title, price, quantity, seller_amount). The platform fee is computed as a fixed percentage of the line price (e.g. 5%); `seller_amount` is price minus that fee.
4. **Stripe session**: `stripe.checkout.sessions.create()` is called with `line_items` derived from the order (unit_amount in pence/cents), `mode: 'payment'`, success/cancel URLs (including `order_id` and `session_id` in the success URL), and `metadata` containing `order_id` and `buyer_id`. The session URL is returned to the client for redirection.
5. **Persistence**: The order row is updated with `stripe_checkout_session_id` so that the order can be correlated with Stripe in phase 2.

**Phase 2 – Verify payment** (`POST /api/checkout/verify-payment`):

1. **Input**: The client sends `sessionId` and `orderId` (e.g. after redirect from Stripe).
2. **Stripe**: The server retrieves the session with `stripe.checkout.sessions.retrieve(sessionId)` and checks `payment_status === 'paid'`.
3. **Order update**: The `orders` row is updated to status `paid`, with `stripe_payment_intent_id` and `paid_at`.
4. **Seller credit**: For each `order_items` row, the server records a `transactions` row (user_id = seller_id, type = `payment`, amount = seller_amount, order_id, status = `completed`) and optionally marks the order item as `seller_paid`. If an RPC such as `increment_balance` exists, it may be called; otherwise balance is derived from the sum of completed transactions.
5. **Cart and purchase history**: The buyer’s cart is cleared for the items in the order. A `purchases` row and corresponding `purchase_items` are created so the buyer has a stable purchase history independent of the `orders`/`order_items` schema.

This design keeps card data entirely within Stripe (PCI-DSS compliance, NFR06), uses server-side verification to avoid trusting client-reported payment status, and maintains auditability through `orders`, `order_items`, and `transactions`.

### 4.3.5 Messaging System

The messaging feature (FR07) is implemented with two main entities: `conversations` (buyer_id, seller_id, product_id, product_title, timestamps) and `messages` (conversation_id, sender_id, content, is_read, created_at).

- **List conversations** (`GET /api/conversations`): Conversations where the current user is either buyer or seller are fetched and enriched with the other participant’s name and profile picture, the last message content and timestamp, and an unread count (messages in the conversation not sent by the current user and with `is_read = false`).
- **Create or get conversation** (`POST /api/conversations`): Given `seller_id` (and optionally product context), the server checks for an existing conversation with the same buyer (current user) and seller; if found, it returns that conversation; otherwise it inserts a new conversation and returns it. Self-messaging is rejected.
- **Messages** (`GET /api/messages/:conversationId`, `POST /api/messages`): Reading messages requires that the user is a participant in the conversation. Sent messages are inserted with `is_read: false` for the recipient; when a user fetches messages, all messages in that conversation not sent by them are marked `is_read: true`. Unread count for badges is computed by counting such messages across the user’s conversations.

Access control is enforced by verifying that the authenticated user is either `buyer_id` or `seller_id` for the conversation before returning or creating messages.

### 4.3.6 Reviews, Profile, and Seller Dashboard

- **Reviews (FR10)**: `POST /reviews` inserts into `reviews` (product_id, user_id, reviewer_name, rating, review_text, product_title) after resolving the reviewer name from the `student` table. `GET /reviews/product/:productId` returns reviews for a product; `GET /reviews/user` returns reviews written by the current user. Rating can be constrained at the database level (e.g. 1–5) to support data integrity (Chung et al., 2000).
- **Profile (FR13)**: `GET /api/profile` returns the current user’s profile from the `student` table plus computed counts (e.g. items listed, reviews written). `POST /api/profile/update` updates first_name and last_name, inserting a `student` row if one does not exist (e.g. after migration from auth-only users). Profile picture upload (`POST /api/profile/picture`) uses Multer memory storage, uploads to Supabase Storage (`profile-pictures` bucket), and updates the `student.profile_picture` URL; file type and size are validated.
- **Seller dashboard (FR09)**: Listings are exposed via `GET /api/my-listings` (products where seller_id = current user) and `GET /api/my-listings/stats` (count and total value). Sellers can update (`PATCH /api/my-listings/:listingId`) and delete (`DELETE /api/my-listings/:listingId`) only their own listings; ownership is checked by comparing `seller_id` to the authenticated user. Sales data can be derived from `order_items` where seller_id = current user and payment has been completed.

### 4.3.7 AI Book Valuator

The AI Book Valuator (FR11) is implemented in `POST /bookValuator`. The client sends book attributes (e.g. ISBN, condition, format). The server:

1. Optionally fetches title and authors from the Google Books API using the ISBN (`getBookInfoFromISBN`).
2. Builds a system prompt that instructs the model to act as a used-book appraiser and return only JSON with `predicted_value` and `reasoning`, including guidelines (condition, format, damage, currency in pounds).
3. Calls the Gemini API (`generateContent`) with the user payload and a `responseMimeType` of `application/json`.
4. Parses the response; if parsing fails, returns a safe structure with null value and the raw reasoning. Errors (missing key, invalid key, rate limit) are caught and returned with appropriate HTTP status codes.

The API key is read from the environment at request time, which is suitable for serverless environments where environment variables may not be available at module load time.

---

## 4.4 Data Structures and Algorithms

### 4.4.1 Cart and Checkout Data Flow

The cart is represented as a set of rows in the `cart` table with a composite logical key `(user_id, product_id)`. The “add to cart” operation is implemented as a read-then-write sequence: select by (user_id, product_id); if a row exists, update quantity; else insert. This avoids duplicate lines per product and keeps the cart representation simple. For checkout, cart rows are read in bulk and converted into Stripe line items and into `order_items` with seller_amount computed as `price * (1 - PLATFORM_FEE_PERCENT/100)` per unit.

### 4.4.2 Search and Filtering

Search uses Supabase (PostgreSQL) `ilike` for case-insensitive substring matching on `title` and, where needed, `description`. Price filters are implemented as range predicates (e.g. `price >= 25 AND price <= 50`) applied in the same query to minimise round-trips. Result enrichment (seller names) uses either a join in the select or per-product queries; the latter was used in the main search endpoints to keep the initial query simple and to avoid N+1 issues by batching or by accepting a bounded number of products per request.

### 4.4.3 Featured Products Ranking

The featured-products algorithm can be expressed as:

1. Fetch products with seller info, ordered by `created_at` descending.
2. Fetch all review rows and build a map `product_id → count`.
3. Attach `review_count` to each product and sort by (review_count descending, created_at descending).
4. Slice the first `limit` items.

Time complexity is O(P + R + P log P) where P is the number of products and R the number of reviews; for typical dashboard sizes this is acceptable and keeps the logic transparent and maintainable.

### 4.4.4 Order and Transaction Consistency

Payment verification performs multiple database writes (order status, order_items seller_paid, transactions, cart deletion, purchases/purchase_items). The implementation does these in a fixed sequence with error handling so that a failure at any step can be logged and reported; idempotency of Stripe session retrieval (by session ID) reduces the risk of double-crediting if the client retries. For stronger consistency, the design could be extended with a single database transaction wrapping all post-payment updates (Sommerville, 2016).

---

## 4.5 Main Problems and Solutions

### 4.5.1 Session and Data Client Separation

**Problem**: Using a single Supabase client for both authentication (e.g. `signInWithPassword`, `getUser`, `signOut`) and data operations caused session state to interfere with admin-style data access. Signing out or session expiry on the auth client could invalidate or alter behaviour for subsequent data queries, leading to inconsistent 401s or wrong user context.

**Solution**: Two client instances were introduced. `supabaseAuth` is used exclusively for authentication (sign-in, sign-up, sign-out, get user, restore session, change password); `supabaseAdmin` uses the same service role key but with session persistence disabled and is used for all `from(...).select/insert/update/delete` operations. Protected routes still resolve the current user via `supabaseAuth.auth.getUser()` and pass that user’s id to queries performed with `supabaseAdmin`. This separation keeps auth state isolated from data access and avoids polluting the data client with user session (Martin, 2017).

### 4.5.2 Product Identifier in Cart and Checkout

**Problem**: The cart stored a product identifier that could be either a UUID (from `ProductTable.product_id`) or a composite value (e.g. `seller_id_title`). Checkout had to resolve each cart item to a single product row for price validation and line-item creation, and failures in resolution caused generic “Product not found” errors.

**Solution**: The checkout handler implements a small resolution algorithm: if the cart item’s `product_id` matches a UUID pattern, the product is fetched by `product_id`; otherwise the product is looked up by `seller_id` and `title` (or by parsing a composite id). The server always re-fetches price and metadata from `ProductTable` so that checkout uses current data and prevents buying one’s own listing. Clear error responses (e.g. product not found, or “You cannot buy your own product”) are returned with appropriate HTTP status codes.

### 4.5.3 File Upload in Serverless and Local Environments

**Problem**: Product image uploads used Multer with a disk destination; in serverless environments (e.g. Vercel) the filesystem is read-only except for `/tmp`, and paths must differ between local and serverless to avoid deployment failures.

**Solution**: The upload directory is set conditionally: `process.env.VERCEL ? '/tmp/uploads' : './uploads'`. After uploading the file to Supabase Storage, the temporary file is deleted with `fs.unlinkSync(file.path)` so that disk usage does not grow. Profile pictures use `multer.memoryStorage()` so no disk path is required; the buffer is uploaded directly to Supabase Storage, which is suitable for both traditional and serverless hosting.

### 4.5.4 Payment Verification and Idempotency

**Problem**: After the user returns from Stripe Checkout, the client calls the verify-payment endpoint. If the user refreshes or the request is retried, the same session could be processed more than once, risking double-crediting of sellers or duplicate purchase records.

**Solution**: Verification is driven by Stripe’s session state: the server retrieves the session and only proceeds if `payment_status === 'paid'`. Order status is then updated to `paid`. A practical improvement would be to check at the start of the handler whether the order is already `paid` and, if so, return success without re-running seller credit and cart clearance, making the endpoint idempotent with respect to session ID and order ID.

### 4.5.5 API Key and Environment Handling in Serverless

**Problem**: The Gemini API key was initially loaded at module load time. In some serverless platforms, environment variables are not available at cold start or differ between invocations, leading to “key not configured” or inconsistent behaviour.

**Solution**: The Book Valuator endpoint reads the API key at request time: `const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY`. If the key is missing, the handler returns a 500 with a clear message so that the front end can disable or hide the feature gracefully. This pattern is applied to Stripe and Supabase where appropriate so that missing configuration is detected per request rather than at startup.

---

## 4.6 Testing and Validation

### 4.6.1 Load Testing

To validate the non-functional requirement for concurrent users (NFR03) and API response behaviour (NFR02), load testing was implemented using Locust (Locust, 2024). A single user class simulates a logged-in user: in `on_start` it performs `POST /signin` with test credentials and stores the returned access token. Tasks are weighted to reflect expected usage: e.g. viewing featured products and search (public) more frequently, and profile, cart, and purchases (authenticated) less so. Authenticated requests send the token in the `Authorization: Bearer <token>` header. The host (e.g. local or Vercel deployment) is configurable via `--host` or environment variable, and test credentials are supplied via environment variables so that the same script can run against different environments without code changes.

This approach provides a repeatable way to measure response times and failure rates under load and to identify bottlenecks (e.g. in search or featured-products aggregation) before deployment.

### 4.6.2 Manual and Exploratory Testing

Critical user flows—registration, sign-in, product listing, search, add to cart, checkout (with Stripe test cards), payment verification, messaging, and reviews—were tested manually against local and deployed instances. Stripe test mode was used throughout so that payments could be completed without real charges. Issues found (e.g. session handling, product resolution at checkout, file upload paths) were addressed with the solutions described in Section 4.5.

---

## 4.7 Summary

This chapter has described the implementation of the StudentHub platform in line with the specification and design of Chapter 3. The three-tier architecture is realised with Express as the application tier, Supabase (PostgreSQL and Storage) as the data tier, and static HTML/CSS/JavaScript as the presentation tier. Core requirements—registration and authentication, product listing and search, persistent cart, Stripe-based checkout, messaging, reviews, profile and seller dashboard, and the AI Book Valuator—are implemented with consistent patterns for session handling, access control, and error handling.

Key design decisions in code include the separation of Supabase auth and data clients, conditional file upload paths for serverless, request-time reading of API keys, and a two-phase checkout flow with server-side payment verification. Data structures and algorithms for cart management, search and filtering, and featured-product ranking were described at a level sufficient to support future maintenance and extension. The main problems encountered—session/data client interference, product resolution at checkout, file uploads in serverless, idempotency of payment verification, and environment handling—were addressed with targeted solutions that preserve security and deployability.

Load testing with Locust and manual testing of critical flows were used to validate performance and correctness. The resulting system meets the specified functional requirements and supports the non-functional goals for security, performance, and maintainability within the chosen technology stack.

---

## References

Chung, L., Nixon, B.A., Yu, E. and Mylopoulos, J. (2000) *Non-Functional Requirements in Software Engineering*. Boston: Kluwer Academic Publishers.

Codd, E.F. (1970) 'A Relational Model of Data for Large Shared Data Banks', *Communications of the ACM*, 13(6), pp. 377–387.

Cohn, M. (2004) *User Stories Applied: For Agile Software Development*. Boston: Addison-Wesley.

Eckerson, W.W. (1995) 'Three Tier Client/Server Architecture: Achieving Scalability, Performance, and Efficiency in Client Server Applications', *Open Information Systems*, 10(1), pp. 3–20.

Fielding, R.T. (2000) *Architectural Styles and the Design of Network-based Software Architectures*. PhD thesis. University of California, Irvine.

Locust (2024) *Locust - A modern load testing framework*. Available at: https://locust.io (Accessed: 9 February 2026).

Martin, R.C. (2017) *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Boston: Prentice Hall.

Sommerville, I. (2016) *Software Engineering*. 10th edn. Harlow: Pearson Education.

Stripe (2024) *Stripe API Reference - Checkout Sessions*. Available at: https://docs.stripe.com/api/checkout/sessions (Accessed: 9 February 2026).

Supabase (2024) *Supabase Documentation - JavaScript Client*. Available at: https://supabase.com/docs/reference/javascript (Accessed: 9 February 2026).
