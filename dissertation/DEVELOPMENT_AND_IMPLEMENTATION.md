# Chapter 4: Development and Implementation

## 4.1 Introduction

This chapter describes how the StudentHub e-commerce platform specified in Chapter 3 was implemented to meet the identified functional and non-functional requirements. The work was organised into three development sprints (increments), each delivering a coherent set of features aligned to specific requirements and user stories. The narrative is structured as a development journey: it shows how the application evolved from a minimal viable commerce core, through engagement and trust-building features, to enhancements and production hardening (Sommerville, 2016). For each sprint, the chapter outlines the requirements in scope, the implementation approach using appropriate data structures and design techniques, the main problems encountered and solutions adopted, and how the outcome was verified. A consolidated treatment of data structures and algorithms used across sprints is provided, followed by a summary that ties the three increments to the full requirement set.

---

## 4.2 Development Approach and Environment

### 4.2.1 Methodology and Sprint Structure

Development followed an iterative, sprint-based approach consistent with Agile practice (Cohn, 2004). Each sprint was treated as an increment: a vertical slice of the system that could be demonstrated and tested end-to-end, from front-end views through the application tier to the database. Priority was driven by the MoSCoW classification from the specification: the first sprint addressed all “Must have” requirements (FR01–FR06), the second the “Should have” features (FR07–FR10, FR13), and the third “Could have” items (FR11) plus deployment reliability and performance validation (NFR03, NFR09, NFR10). This ordering ensured that a usable marketplace—registration, listing, search, cart, and secure payment—was in place before adding messaging, reviews, and seller tools, and before layering on the AI Book Valuator and production fixes.

### 4.2.2 Technology Stack and Tooling

The technology stack matched the design documented in Chapter 3. The application tier was implemented in Node.js (v18+) with ES modules (`"type": "module"` in `package.json`) and Express.js 5.x for routing and REST API implementation (Fielding, 2000). The data tier used Supabase (PostgreSQL) via `@supabase/supabase-js`, with two distinct client instances: one for authentication (`supabaseAuth`) and one for data operations (`supabaseAdmin`), as detailed in Section 4.7.1. Payments were integrated using the Stripe SDK (Checkout Sessions and payment verification); file uploads used Multer (disk storage for product images, with a serverless-safe path; memory storage for profile pictures). External APIs—Google Books for ISBN metadata and Google Gemini for the AI Book Valuator—were called with API keys read from environment variables at request time to support serverless deployment. Configuration was externalised via environment variables (e.g. `ini.env` locally and platform env vars in production), supporting maintainability and secure handling of secrets (NFR10).

---

## 4.3 Sprint 1: Foundation and Core Commerce (MVP)

### 4.3.1 Scope and Objectives

The first sprint aimed to deliver a minimal viable product: a student could register, sign in, list items with photos, search and filter products, add items to a persistent cart, and complete a purchase via secure card payment. This directly addressed the “Must have” functional requirements FR01–FR06 and the security-related non-functional requirements NFR04 (TLS), NFR05 (session management), and NFR06 (payment security). The corresponding user stories were: *“As a student, I want to create an account so that I can buy and sell items on the platform”*; *“As a registered user, I want to securely log in so that my account and transactions are protected”*; *“As a seller, I want to list my items with photos so that buyers can see what I'm selling”*; *“As a buyer, I want to search for products by name … and filter … by price range”*; *“As a buyer, I want to add items to my cart so that I can purchase multiple items at once”*; and *“As a buyer, I want to pay securely with my card so that my financial information is protected.”*

### 4.3.2 Implementation

**Authentication (FR01, FR02).** Registration was implemented as `POST /signup`: the server created the user in Supabase Auth with the admin API and inserted a corresponding row into the `student` table with the same `id`, preserving referential integrity with the ER design (Codd, 1970). Sign-in (`POST /signin`) used `signInWithPassword`; on success, the server returned the user identifier and session tokens (access and refresh) to the client. The client stored these and, for protected routes, either sent them in the `Authorization` header or used `POST /api/restore-session` so that the server could restore the session and resolve the current user via `supabase.auth.getUser()`. Protected endpoints consistently checked for an authenticated user and returned HTTP 401 when absent, satisfying NFR05.

**Product listing (FR03).** The `POST /uploadProduct` handler accepted multipart form data (title, description, price, category, condition, image). The image was validated, written to a temporary path (with a serverless-safe directory as in Section 4.5.3), uploaded to Supabase Storage under `{seller_id}/{timestamp}.{ext}`, and the public URL was stored with the product. A single row was inserted into `ProductTable` with `seller_id` from the authenticated user, keeping the application tier responsible for access control and storage orchestration (Eckerson, 1995).

**Search (FR04).** Two search surfaces were implemented. Keyword and category search (`GET /search`, `GET /search/category`) used Supabase queries with `ilike` on `title` (and `description` for keyword) and optional category and price-range filters (e.g. 0–25, 25–50, 50–100, 100–200, 200+), applied with `.gte()` and `.lte()` on `price`. Results were enriched with seller names from the `student` table. A lighter endpoint `GET /api/products/search` supported live/autocomplete-style search with a minimum query length and a configurable limit, returning a compact payload to support responsive UI and NFR02 (API response time).

**Shopping cart (FR05).** The cart was implemented as a persistent store in the `cart` table, keyed logically by `(user_id, product_id)`. Add to cart (`POST /api/cart`) checked for an existing row; if found, quantity was incremented; otherwise a new row was inserted with quantity 1 and denormalised fields (title, price, image_url, category, condition, seller_id, seller_name) to simplify cart display and checkout. Update quantity (`PATCH /api/cart/:itemId`), remove item (`DELETE /api/cart/:itemId`), and clear cart (`DELETE /api/cart`) were scoped by `user_id`. Cart count for the UI was provided by `GET /api/cart/count`.

**Checkout and payment (FR06, NFR06).** A two-phase flow was implemented. Phase 1 (`POST /api/checkout/create-session`): the client sent cart items; the server resolved each item to a product row (by UUID or by `seller_id` and title), validated that the buyer was not purchasing their own listing, computed subtotal and platform fee (e.g. 5%), created an `orders` row (status `pending`) and `order_items` rows, called `stripe.checkout.sessions.create()` with line items and success/cancel URLs, stored the Stripe session id on the order, and returned the session URL to the client. Phase 2 (`POST /api/checkout/verify-payment`): after the user completed payment on Stripe, the client sent `sessionId` and `orderId`; the server retrieved the session, confirmed `payment_status === 'paid'`, updated the order to `paid`, credited sellers via `transactions` rows, cleared the buyer’s cart, and created `purchases` and `purchase_items` for order history. Card data remained entirely within Stripe (PCI-DSS, NFR06).

### 4.3.3 Problems Encountered and Solutions

- **Session and data client separation (Section 4.7.1).** A single Supabase client used for both auth and data led to session state affecting data operations and inconsistent 401s. The solution was to introduce two clients: `supabaseAuth` for sign-in, sign-up, sign-out, get user, and restore session; `supabaseAdmin` for all database queries. Protected routes resolve the user via `supabaseAuth.auth.getUser()` and perform data operations with `supabaseAdmin` (Martin, 2017).
- **Product identifier in cart and checkout (Section 4.7.2).** The cart sometimes stored a composite product identifier rather than a UUID. Checkout implemented a resolution step: match by UUID if the pattern fit, otherwise look up by `seller_id` and `title`, always re-fetching price from `ProductTable` and rejecting self-purchase with a clear error.
- **File upload in serverless (Section 4.7.3).** Product uploads used Multer with a disk destination. On Vercel, only `/tmp` is writable. The upload directory was set conditionally (`process.env.VERCEL ? '/tmp/uploads' : './uploads'`), and the temporary file was deleted after uploading to Supabase Storage.

### 4.3.4 Outcome

By the end of Sprint 1, the application supported end-to-end registration, authentication, listing, search, cart, and Stripe checkout. The MVP could be run locally and deployed to Vercel, with security requirements NFR04–NFR06 addressed through HTTPS, session handling, and delegation of payment to Stripe.

---

## 4.4 Sprint 2: Engagement, Trust, and User Experience

### 4.4.1 Scope and Objectives

The second sprint focused on engagement and trust: in-app messaging with sellers, order and purchase history, seller dashboard (manage listings and view sales), product reviews, and profile management. This corresponded to FR07 (Messaging), FR08 (Order History), FR09 (Seller Dashboard), FR10 (Product Reviews), and FR13 (Profile Management), and to the user stories: *“As a user, I want to message sellers directly so that I can ask questions about products”*; *“As a buyer, I want to view my purchase history”*; *“As a seller, I want to see my earnings so that I can track my sales performance”* and to manage listings; and the need for users to update profile information and upload profile pictures. Non-functional emphasis included API response behaviour (NFR02) and usability (NFR07, NFR08) through consistent UI and mobile-friendly layout.

### 4.4.2 Implementation

**Messaging (FR07).** The `conversations` and `messages` tables were used as designed. `GET /api/conversations` returned conversations where the current user was buyer or seller, enriched with the other participant’s name and profile picture, last message content and timestamp, and unread count. `POST /api/conversations` found or created a conversation by buyer and seller; self-messaging was rejected. `GET /api/messages/:conversationId` and `POST /api/messages` enforced participation checks; incoming messages were marked read when a user opened the thread. Unread count for badges was computed across the user’s conversations. Access control was enforced by verifying that the authenticated user was either `buyer_id` or `seller_id` before returning or creating data.

**Order history (FR08).** Orders were already created in Sprint 1; Sprint 2 exposed them via `GET /api/orders` and `GET /api/orders/:orderId` for the current user, with `order_items` joined. The `purchases` and `purchase_items` tables populated at payment verification provided a stable purchase history for the buyer-facing “Purchase history” view.

**Seller dashboard (FR09).** `GET /api/my-listings` returned products where `seller_id` matched the current user; `GET /api/my-listings/stats` provided listing count and total value. `PATCH /api/my-listings/:listingId` and `DELETE /api/my-listings/:listingId` allowed update and delete only after verifying ownership. Sales data for sellers could be derived from `order_items` where `seller_id` matched the user and payment was completed; balance was exposed via `GET /api/balance` using the `transactions` table.

**Reviews (FR10).** `POST /reviews` inserted into `reviews` (product_id, user_id, reviewer_name, rating, review_text, product_title) after resolving the reviewer name from the `student` table. `GET /reviews/product/:productId` and `GET /reviews/user` returned product reviews and the current user’s reviews respectively. Rating was constrained (e.g. 1–5) at the database level to support data integrity (Chung et al., 2000).

**Profile (FR13).** `GET /api/profile` returned the current user’s profile from `student` plus computed counts (items listed, reviews written). `POST /api/profile/update` updated first_name and last_name, inserting a `student` row if missing. Profile picture upload (`POST /api/profile/picture`) used Multer memory storage to avoid disk paths, uploaded the buffer to Supabase Storage (`profile-pictures` bucket), and updated `student.profile_picture`. File type and size were validated.

### 4.4.3 Problems Encountered and Solutions

- **Path consistency for server-rendered views.** Some routes (e.g. `/landingpage`, `/profile`, `/settings`) used `sendFile` with paths relative to `__dirname`. The actual files lived under `public/views/`. Paths were standardised to `path.join(__dirname, 'public', 'views', '<filename>')` so that the same code worked locally and on Vercel, where the project root is the function context.

### 4.4.4 Outcome

Sprint 2 delivered the full “Should have” set: users could message sellers, view order and purchase history, manage listings and see sales-related data, leave and view reviews, and update their profile and profile picture. The platform felt complete for day-to-day buying and selling, with clearer trust signals and usability.

---

## 4.5 Sprint 3: Enhancement, Deployment, and Validation

### 4.5.1 Scope and Objectives

The third sprint had three goals: add a differentiating “Could have” feature (the AI Book Valuator, FR11), stabilise deployment and address production issues (NFR09, reliability), and validate performance and scalability (NFR03). The user story in scope was the ability to obtain an AI-powered book valuation using ISBN and condition. In parallel, deployment failures on Vercel (e.g. after git push) were diagnosed and fixed, security headers were added, and load testing was introduced to verify that the system could support the target concurrency and response-time expectations (NFR02, NFR03). Maintainability (NFR10) was supported by consistent patterns and by ensuring environment and build configuration were documented and reproducible.

### 4.5.2 Implementation

**AI Book Valuator (FR11).** The `POST /bookValuator` endpoint accepted book attributes (e.g. ISBN, condition, format). The server optionally fetched title and authors from the Google Books API by ISBN (`getBookInfoFromISBN`), built a system prompt instructing the model to act as a used-book appraiser and return only JSON with `predicted_value` and `reasoning` (in pounds), and called the Gemini API with `responseMimeType: 'application/json'`. The response was parsed; on parse failure, a safe structure with null value and raw reasoning was returned. The API key was read from the environment at request time (`GOOGLE_API_KEY` or `GEMINI_API_KEY`) so that serverless cold starts did not see missing or stale keys (Section 4.7.5). Errors (invalid key, rate limit) were caught and returned with appropriate HTTP status codes so the front end could disable or hide the feature gracefully.

**Deployment and production fixes.** Vercel deployment was failing on auto-redeploy after git push. Investigation pointed to the build step: no explicit build script was defined, and some configurations attempted to run a build that did not exist. In `vercel.json`, `buildCommand` was set to an empty string to skip framework-style builds, and `installCommand` was set explicitly to `npm install`. A no-op `build` script was added to `package.json` (`"build": "echo 'No build step'"`) so that any invocation of `npm run build` would succeed. Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy) were added in `vercel.json` to improve security posture and address browser or scanner warnings where applicable. These changes restored reliable auto-redeploy and aligned with NFR09 and security expectations.

**Load testing (NFR03, NFR02).** Load testing was implemented with Locust (Locust, 2024). A single user class performed `POST /signin` in `on_start` and stored the access token; tasks were weighted to reflect expected usage (e.g. featured products and search more frequently, profile and cart less). Authenticated requests used the `Authorization: Bearer <token>` header. The host and test credentials were configurable via environment variables so the same script could run against local or Vercel deployments. This provided a repeatable way to measure response times and failure rates under load and to identify bottlenecks before production use.

### 4.5.3 Problems Encountered and Solutions

- **Vercel deployment failure.** Build or install steps were failing; the exact error was visible in the Vercel deployment logs. Fixes were to set `buildCommand` to `""` in `vercel.json`, add the no-op `build` script in `package.json`, and ensure static and server routes and file paths (e.g. `public/views/`) were consistent so that the serverless function could resolve assets correctly.
- **API key at cold start (Section 4.5.5).** Reading the Gemini API key at module load time caused issues in serverless environments. The Book Valuator handler was changed to read the key at request time and to return a clear error if the key was missing, allowing the front end to degrade gracefully.
- **Egress and performance awareness.** Supabase egress limits (e.g. 5 GB on the free tier) were observed. Recommendations applied in development included selecting only required columns in queries, using limits and pagination for search and featured products, and avoiding unnecessary repeated requests; these practices also supported NFR02 and NFR03.

### 4.5.4 Outcome

Sprint 3 delivered the AI Book Valuator (FR11), reliable Vercel deployment with security headers, and a load-testing approach for NFR02 and NFR03. The application could be developed, pushed to git, and auto-deployed to Vercel with confidence, and performance could be monitored and improved using Locust.

---

## 4.6 Data Structures and Algorithms (Cross-Sprint)

The following structures and algorithms were used across the sprints and are summarised here for maintainability and future extension.

**Cart and checkout.** The cart is represented as rows in the `cart` table with a composite logical key `(user_id, product_id)`. Add-to-cart is a read-then-write: select by (user_id, product_id); if exists, update quantity; else insert. Checkout reads cart rows, resolves each to a product row, builds Stripe line items and `order_items` with `seller_amount = price * (1 - PLATFORM_FEE_PERCENT/100)` per unit, and after payment verification updates orders, records transactions, clears the cart, and creates purchases/purchase_items. Idempotency is improved by driving verification from Stripe session state and by only proceeding when `payment_status === 'paid'` (Sommerville, 2016).

**Search and filtering.** Search uses PostgreSQL `ilike` for case-insensitive substring matching on `title` and `description`. Price filters are range predicates in the same query. Result enrichment (seller names) is done via joins or per-product queries with a bounded result set to control cost and egress.

**Featured products.** Products are fetched with seller info; review counts are aggregated from `reviews` into a map keyed by `product_id`; each product is annotated with `review_count` and the list is sorted by review count descending then `created_at` descending; the first N items are returned. Complexity is O(P + R + P log P) for P products and R reviews, which is acceptable for typical dashboard sizes.

**Order and transaction consistency.** Payment verification performs multiple writes (order status, order_items, transactions, cart deletion, purchases, purchase_items) in a fixed sequence with error handling. A single database transaction around these steps could be introduced for stronger consistency if required.

---

## 4.7 Main Problems and Solutions (Consolidated)

### 4.7.1 Session and Data Client Separation

**Problem:** A single Supabase client for both authentication and data operations led to session state affecting data access, inconsistent 401s, and wrong user context after sign-out or expiry.

**Solution:** Two clients: `supabaseAuth` for auth only; `supabaseAdmin` for all `from(...).select/insert/update/delete`. Protected routes resolve the user via `supabaseAuth.auth.getUser()` and perform data operations with `supabaseAdmin` (Martin, 2017).

### 4.7.2 Product Identifier in Cart and Checkout

**Problem:** Cart stored either a UUID or a composite product id; checkout resolution failed or produced generic errors.

**Solution:** Checkout resolution by UUID pattern or by `seller_id` and `title`; always re-fetch price from `ProductTable`; reject self-purchase with explicit error messages and correct HTTP status codes.

### 4.7.3 File Upload in Serverless and Local Environments

**Problem:** Multer disk storage failed on Vercel where only `/tmp` is writable.

**Solution:** Upload directory set to `process.env.VERCEL ? '/tmp/uploads' : './uploads'`; temp file deleted after Supabase Storage upload. Profile pictures use `multer.memoryStorage()` and upload the buffer directly, avoiding disk paths.

### 4.7.4 Payment Verification and Idempotency

**Problem:** Retries or refresh on the success page could re-run verification and risk double-crediting or duplicate records.

**Solution:** Verification is driven by Stripe session state; only proceed when `payment_status === 'paid'`. A further improvement is to check at the start of the handler whether the order is already `paid` and, if so, return success without re-running seller credit and cart clearance.

### 4.7.5 API Key and Environment Handling in Serverless

**Problem:** API keys loaded at module load time were missing or inconsistent in serverless cold starts.

**Solution:** Book Valuator (and similar features) read the API key at request time; missing key returns a clear 500 so the front end can disable the feature. Configuration is externalised so production secrets are not in code (NFR10).

---

## 4.8 Testing and Validation

**Load testing.** Locust was used to simulate logged-in users (sign-in once, then weighted tasks for featured products, search, profile, cart, purchases). Host and credentials were configurable. This validated NFR03 and informed NFR02 (response times) and egress/performance tuning.

**Manual testing.** End-to-end flows—registration, sign-in, listing, search, cart, checkout with Stripe test cards, payment verification, messaging, reviews, profile and picture upload—were tested manually on local and Vercel deployments. Issues found (session handling, checkout resolution, file paths, deployment config) were addressed in the relevant sprints and in Section 4.7.

---

## 4.9 Summary

This chapter has presented the implementation of the StudentHub platform as a development journey in three sprints. **Sprint 1** established the foundation: user registration and authentication (FR01, FR02), product listing and search (FR03, FR04), persistent cart (FR05), and secure Stripe checkout (FR06), meeting the “Must have” requirements and core security NFRs (NFR04–NFR06). **Sprint 2** added engagement and trust: messaging (FR07), order and purchase history (FR08), seller dashboard (FR09), product reviews (FR10), and profile management (FR13), fulfilling the “Should have” set and supporting usability. **Sprint 3** added the AI Book Valuator (FR11), fixed Vercel deployment and security headers, and introduced load testing to validate NFR02 and NFR03 and support NFR09 and NFR10.

The three-tier architecture from Chapter 3 was realised throughout: Express as the application tier, Supabase (PostgreSQL and Storage) as the data tier, and static HTML/CSS/JavaScript as the presentation tier. Recurring problems—session versus data client, product resolution at checkout, file uploads in serverless, payment verification idempotency, and environment handling—were addressed with the solutions summarised in Section 4.7. The result is a system that meets the specified functional requirements, supports the targeted non-functional goals for security, performance, scalability, and maintainability, and reflects an iterative, requirement-driven development journey from MVP to production-ready student marketplace.

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
