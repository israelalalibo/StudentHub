# Chapter 3: Specification and Design

## 3.1 Requirements Engineering

Requirements were gathered through stakeholder analysis, use case modelling, and competitive analysis, then prioritised using MoSCoW methodology (Sommerville, 2016).

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR01 | User registration and authentication | Must |
| FR02 | Product listing with images, price, category, condition | Must |
| FR03 | Product search with keyword and price filters | Must |
| FR04 | Persistent shopping cart | Must |
| FR05 | Secure checkout via Stripe payment gateway | Must |
| FR06 | In-app messaging between buyers and sellers | Should |
| FR07 | Order history and seller dashboard | Should |
| FR08 | Product reviews and ratings | Should |
| FR09 | AI-powered book valuation (Google Gemini) | Could |
| FR10 | Email notifications on transaction completion | Could |

### Non-Functional Requirements

| Category | Requirement | Metric |
|----------|-------------|--------|
| Performance | Page load time | < 3 seconds |
| Security | Data encryption | TLS 1.3, PCI-DSS compliance via Stripe |
| Usability | Mobile responsiveness | Fully functional ≥320px width |
| Reliability | System uptime | 99.5% availability |

---

## 3.2 System Architecture

The system follows a **three-tier client-server architecture** (Eckerson, 1995), separating presentation, application logic, and data storage for maintainability and scalability.

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRESENTATION TIER          │  APPLICATION TIER    │  DATA TIER    │
│  (Browser)                  │  (Node.js/Express)   │  (Supabase)   │
├─────────────────────────────┼──────────────────────┼───────────────┤
│  HTML/CSS/JavaScript        │  REST API Routes     │  PostgreSQL   │
│  Static Assets              │  Business Logic      │  Auth System  │
│                             │  Stripe/Gemini APIs  │  File Storage │
└─────────────────────────────┴──────────────────────┴───────────────┘
```

**Technology Stack Justification:**
- **Node.js/Express**: JavaScript consistency across stack; event-driven I/O efficiency (Tilkov & Vinoski, 2010)
- **Supabase (PostgreSQL)**: Built-in authentication, row-level security, generous free tier
- **Stripe**: PCI-DSS Level 1 compliance; card details never touch our servers
- **Google Gemini API**: State-of-the-art LLM for book valuation feature

---

## 3.3 Database Design

The database follows Third Normal Form (3NF) to eliminate redundancy (Codd, 1970). Core entities include:

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| student | User profiles | Links to auth.users |
| ProductTable | Product listings | FK: seller_id → student |
| cart | Shopping cart items | FK: user_id, product_id |
| orders / order_items | Purchase records | FK: buyer_id, seller_id |
| conversations / messages | Messaging system | FK: buyer_id, seller_id |
| transactions | Payment records | FK: user_id, order_id |

Data integrity is enforced through primary keys (UUID), foreign key constraints with CASCADE delete, and Supabase Row Level Security policies restricting access by user ID.

---

## 3.4 User Interface Design

The UI follows Nielsen's (1994) usability heuristics, emphasising visibility of system status, consistency, and error prevention. The information architecture uses a hub-and-spoke model centred on the landing page (Rosenfeld & Morville, 2002).

**Design System:** Primary colour `#667eea` (purple gradient); 'Segoe UI' typography; card-based layouts with 20px border-radius; mobile-first responsive design.

**Key Pages:** Login/Signup → Landing Page (search, categories, featured products) → Product Details → Cart → Stripe Checkout → Order Confirmation. Secondary flows include Profile, Messages, My Listings, and Purchase History.

---

## 3.5 Security Design

Security implements defence-in-depth: passwords hashed via Supabase Auth (bcrypt), JWT session tokens with automatic refresh, server-side validation on all protected endpoints, and Row Level Security at the database layer. Payment security is delegated entirely to Stripe, ensuring PCI-DSS compliance without sensitive card data touching our servers. All communications use HTTPS/TLS 1.3.

---

## 3.6 Design Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Server-rendered pages vs SPA | Simpler architecture; better SEO; faster initial load | Less dynamic interactivity |
| Supabase vs custom backend | Reduced development time; built-in auth; free tier | Vendor lock-in |
| Stripe vs custom payments | Industry-standard security; handles compliance | 2.9% + 30p transaction fees |

---

## References

Codd, E.F. (1970) 'A Relational Model of Data for Large Shared Data Banks', *Communications of the ACM*, 13(6), pp. 377-387.

Eckerson, W.W. (1995) 'Three Tier Client/Server Architecture', *Open Information Systems*, 10(1), pp. 3-20.

Nielsen, J. (1994) 'Enhancing the Explanatory Power of Usability Heuristics', *Proceedings of SIGCHI*, pp. 152-158.

Rosenfeld, L. and Morville, P. (2002) *Information Architecture for the World Wide Web*. 2nd edn. O'Reilly Media.

Sommerville, I. (2016) *Software Engineering*. 10th edn. Pearson Education.

Tilkov, S. and Vinoski, S. (2010) 'Node.js: Using JavaScript to Build High-Performance Network Programs', *IEEE Internet Computing*, 14(6), pp. 80-83.
