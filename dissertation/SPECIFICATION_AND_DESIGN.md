# Chapter 3: Specification and Design

## 3.1 Introduction

This chapter presents the systematic approach taken to gather requirements and design the StudentHub e-commerce platform. The development followed an iterative methodology combining elements of Agile development with user-centred design principles (Preece, Rogers & Sharp, 2015). The specification phase identified both functional and non-functional requirements through stakeholder analysis, while the design phase translated these requirements into a coherent system architecture using industry-standard modelling techniques.

---

## 3.2 Requirements Engineering

### 3.2.1 Requirements Gathering Methodology

The requirements gathering process employed multiple elicitation techniques as recommended by Sommerville (2016):

1. **Stakeholder Analysis** - Identifying primary users (students as buyers/sellers), secondary users (university administrators), and system administrators
2. **Use Case Analysis** - Documenting user interactions with the system
3. **Competitive Analysis** - Examining existing platforms (eBay, Facebook Marketplace, Depop) to identify essential features and improvement opportunities
4. **MoSCoW Prioritisation** - Categorising requirements by importance (Must have, Should have, Could have, Won't have)

### 3.2.2 Functional Requirements

The functional requirements define what the system must do (IEEE, 1998). Table 3.1 presents the core functional requirements identified for StudentHub:

**Table 3.1: Functional Requirements**

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR01 | User Registration | Must | Users shall be able to create accounts using email and password |
| FR02 | User Authentication | Must | Users shall be able to securely sign in and sign out |
| FR03 | Product Listing | Must | Sellers shall be able to list products with title, description, price, category, condition, and images |
| FR04 | Product Search | Must | Users shall be able to search products by keyword and filter by price range and category |
| FR05 | Shopping Cart | Must | Buyers shall be able to add, remove, and modify quantities of items in a persistent cart |
| FR06 | Secure Checkout | Must | The system shall process payments securely through Stripe payment gateway |
| FR07 | Messaging System | Should | Users shall be able to communicate with sellers through an in-app messaging system |
| FR08 | Order History | Should | Users shall be able to view their purchase history and order details |
| FR09 | Seller Dashboard | Should | Sellers shall be able to manage their listings and view sales statistics |
| FR10 | Product Reviews | Should | Buyers shall be able to leave reviews and ratings for products |
| FR11 | AI Book Valuator | Could | The system shall provide AI-powered book valuation using ISBN lookup |
| FR12 | Email Notifications | Could | The system shall send confirmation emails to buyers and sellers upon transaction completion |
| FR13 | Profile Management | Should | Users shall be able to update their profile information and upload profile pictures |

### 3.2.3 Non-Functional Requirements

Non-functional requirements specify the quality attributes and constraints of the system (Chung et al., 2000). Table 3.2 documents these requirements:

**Table 3.2: Non-Functional Requirements**

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| NFR01 | Performance | Page load time | < 3 seconds on standard broadband |
| NFR02 | Performance | API response time | < 500ms for 95% of requests |
| NFR03 | Scalability | Concurrent users | Support minimum 100 simultaneous users |
| NFR04 | Security | Data encryption | All sensitive data encrypted using TLS 1.3 |
| NFR05 | Security | Authentication | Secure session management with JWT tokens |
| NFR06 | Security | Payment security | PCI-DSS compliance through Stripe |
| NFR07 | Usability | Accessibility | WCAG 2.1 Level AA compliance |
| NFR08 | Usability | Mobile responsiveness | Fully functional on devices ≥320px width |
| NFR09 | Reliability | Uptime | 99.5% availability |
| NFR10 | Maintainability | Code documentation | All API endpoints documented |

### 3.2.4 Use Case Modelling

Use case diagrams provide a high-level view of system functionality from the user's perspective (Cockburn, 2001). Figure 3.1 illustrates the primary use cases for StudentHub.

**Figure 3.1: Use Case Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           StudentHub System                                  │
│                                                                             │
│    ┌──────────────┐                              ┌──────────────┐          │
│    │  Register    │                              │ Manage       │          │
│    │  Account     │                              │ Listings     │          │
│    └──────┬───────┘                              └──────┬───────┘          │
│           │                                             │                   │
│    ┌──────┴───────┐         ┌──────────────┐    ┌──────┴───────┐          │
│    │  Sign In/    │         │   Search     │    │  View Sales  │          │
│    │  Sign Out    │         │   Products   │    │  Statistics  │          │
│    └──────┬───────┘         └──────┬───────┘    └──────────────┘          │
│           │                        │                                        │
│           │                 ┌──────┴───────┐                               │
│           │                 │  View Product │                               │
│           │                 │   Details    │                                │
│           │                 └──────┬───────┘                               │
│           │                        │                                        │
│    ┌──────┴───────┐         ┌──────┴───────┐    ┌──────────────┐          │
│    │   Manage     │         │   Add to     │    │   Send       │          │
│    │   Profile    │         │    Cart      │    │   Message    │          │
│    └──────────────┘         └──────┬───────┘    └──────────────┘          │
│                                    │                                        │
│                             ┌──────┴───────┐                               │
│                             │   Checkout   │                                │
│                             │   (Stripe)   │                                │
│                             └──────┬───────┘                               │
│                                    │                                        │
│                             ┌──────┴───────┐    ┌──────────────┐          │
│                             │    View      │    │   Write      │          │
│                             │   Orders     │    │   Review     │          │
│                             └──────────────┘    └──────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
        │                              │                        │
        │                              │                        │
   ┌────┴────┐                   ┌─────┴─────┐            ┌─────┴─────┐
   │  Guest  │                   │   Buyer   │            │  Seller   │
   │  User   │                   │           │            │           │
   └─────────┘                   └───────────┘            └───────────┘
```

### 3.2.5 User Stories

Following Agile methodology, requirements were also captured as user stories (Cohn, 2004). Key user stories include:

**Authentication:**
- *"As a student, I want to create an account so that I can buy and sell items on the platform."*
- *"As a registered user, I want to securely log in so that my account and transactions are protected."*

**Buying:**
- *"As a buyer, I want to search for products by name so that I can quickly find what I need."*
- *"As a buyer, I want to filter products by price range so that I can find items within my budget."*
- *"As a buyer, I want to add items to my cart so that I can purchase multiple items at once."*
- *"As a buyer, I want to pay securely with my card so that my financial information is protected."*

**Selling:**
- *"As a seller, I want to list my items with photos so that buyers can see what I'm selling."*
- *"As a seller, I want to receive notifications when my items sell so that I can arrange delivery."*
- *"As a seller, I want to see my earnings so that I can track my sales performance."*

**Communication:**
- *"As a user, I want to message sellers directly so that I can ask questions about products."*

---

## 3.3 System Architecture Design

### 3.3.1 Architectural Pattern Selection

The system architecture follows a **three-tier client-server model** (Eckerson, 1995), separating concerns into:

1. **Presentation Tier** - Client-side HTML, CSS, JavaScript
2. **Application Tier** - Node.js/Express.js server handling business logic
3. **Data Tier** - Supabase (PostgreSQL) database

This architecture was selected for several reasons:

- **Separation of Concerns**: Each tier can be developed, tested, and scaled independently (Martin, 2017)
- **Maintainability**: Changes to one tier minimally impact others
- **Scalability**: Tiers can be scaled horizontally as demand increases
- **Security**: Database is never directly exposed to clients

**Figure 3.2: Three-Tier Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION TIER                                   │
│                         (Client Browser)                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    HTML     │  │    CSS      │  │ JavaScript  │  │   Assets    │        │
│  │   Views     │  │   Styles    │  │   Logic     │  │   Images    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTPS (REST API)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION TIER                                    │
│                      (Node.js / Express.js Server)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Routes    │  │ Controllers │  │  Services   │  │ Middleware  │        │
│  │  /signin    │  │   Auth      │  │   Email     │  │   CORS      │        │
│  │  /signup    │  │   Products  │  │   Stripe    │  │   Auth      │        │
│  │  /api/*     │  │   Cart      │  │   Gemini    │  │   Multer    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Supabase Client SDK
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA TIER                                         │
│                    (Supabase - PostgreSQL)                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   student   │  │ProductTable │  │    cart     │  │   orders    │        │
│  │   (users)   │  │ (listings)  │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   reviews   │  │conversations│  │  messages   │  │transactions │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │     Supabase Storage        │                          │
│                    │  (Product & Profile Images) │                          │
│                    └─────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │          EXTERNAL SERVICES              │
                    │  ┌──────────┐  ┌──────────┐  ┌────────┐│
                    │  │  Stripe  │  │  Google  │  │  SMTP  ││
                    │  │ Payments │  │  Gemini  │  │  Email ││
                    │  └──────────┘  └──────────┘  └────────┘│
                    └─────────────────────────────────────────┘
```

### 3.3.2 Technology Stack Justification

**Table 3.3: Technology Stack Selection Rationale**

| Component | Technology | Justification |
|-----------|------------|---------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) | Universal browser support; no build tooling required; rapid development (Mozilla, 2023) |
| Backend | Node.js with Express.js | Event-driven architecture ideal for I/O-bound operations; large npm ecosystem; JavaScript consistency across stack (Tilkov & Vinoski, 2010) |
| Database | Supabase (PostgreSQL) | Open-source; built-in authentication; real-time capabilities; row-level security; generous free tier for student projects |
| Payments | Stripe | Industry-leading security (PCI-DSS Level 1); extensive documentation; test mode for development; handles complex payment flows |
| AI Integration | Google Gemini API | State-of-the-art language model; generous free tier; structured JSON output support |
| File Storage | Supabase Storage | Integrated with database; CDN delivery; access control policies |
| Email | Nodemailer with SMTP | Flexible; supports multiple providers; well-documented |

### 3.3.3 RESTful API Design

The API follows REST architectural principles (Fielding, 2000), using standard HTTP methods and meaningful resource URIs. Table 3.4 documents the core API endpoints:

**Table 3.4: API Endpoint Design**

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/signin` | User authentication | Public |
| POST | `/signup` | User registration | Public |
| POST | `/logout` | End user session | Required |
| GET | `/search` | Search products by keyword | Public |
| GET | `/search/category` | Filter products by category | Public |
| GET | `/api/featured-products` | Get featured products | Public |
| GET | `/api/cart` | Get user's cart items | Required |
| POST | `/api/cart` | Add item to cart | Required |
| PATCH | `/api/cart/:itemId` | Update cart item quantity | Required |
| DELETE | `/api/cart/:itemId` | Remove item from cart | Required |
| POST | `/api/checkout/create-session` | Initiate Stripe checkout | Required |
| POST | `/api/checkout/verify-payment` | Verify payment completion | Required |
| GET | `/api/conversations` | Get user's conversations | Required |
| POST | `/api/messages` | Send a message | Required |
| GET | `/api/profile` | Get user profile | Required |
| POST | `/api/profile/update` | Update profile | Required |
| POST | `/reviews` | Submit a product review | Required |
| POST | `/bookValuator` | AI book valuation | Public |

---

## 3.4 Database Design

### 3.4.1 Entity-Relationship Model

The database design follows normalisation principles to Third Normal Form (3NF) to eliminate data redundancy and ensure data integrity (Codd, 1970). Figure 3.3 presents the Entity-Relationship diagram.

**Figure 3.3: Entity-Relationship Diagram**

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     student     │       │  ProductTable   │       │     reviews     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id (UUID)    │───┐   │ PK product_id   │───┐   │ PK review_id    │
│    first_name   │   │   │ FK seller_id    │◄──┼───│ FK product_id   │
│    last_name    │   │   │    title        │   │   │ FK user_id      │
│    phone        │   │   │    description  │   │   │    rating       │
│    profile_pic  │   │   │    price        │   │   │    review_text  │
│    created_at   │   │   │    category     │   │   │    created_at   │
└────────┬────────┘   │   │    condition    │   │   └─────────────────┘
         │            │   │    image_url    │   │
         │            │   │    created_at   │   │
         │            │   └────────┬────────┘   │
         │            │            │            │
         │            │            │            │
         ▼            │            ▼            │
┌─────────────────┐   │   ┌─────────────────┐   │   ┌─────────────────┐
│      cart       │   │   │     orders      │   │   │  order_items    │
├─────────────────┤   │   ├─────────────────┤   │   ├─────────────────┤
│ PK id           │   │   │ PK order_id     │   │   │ PK order_item_id│
│ FK user_id      │◄──┤   │ FK buyer_id     │◄──┤   │ FK order_id     │
│ FK product_id   │   │   │    subtotal     │   └───│ FK product_id   │
│    title        │   │   │    platform_fee │       │ FK seller_id    │
│    price        │   │   │    total_amount │       │    title        │
│    quantity     │   │   │    status       │       │    price        │
│    added_at     │   │   │    created_at   │       │    quantity     │
└─────────────────┘   │   └─────────────────┘       │    seller_amount│
                      │                             └─────────────────┘
                      │
┌─────────────────┐   │   ┌─────────────────┐       ┌─────────────────┐
│  conversations  │   │   │    messages     │       │  transactions   │
├─────────────────┤   │   ├─────────────────┤       ├─────────────────┤
│ PK id           │   │   │ PK id           │       │ PK transaction_id│
│ FK buyer_id     │◄──┤   │ FK conversation │       │ FK user_id      │
│ FK seller_id    │◄──┘   │ FK sender_id    │       │ FK order_id     │
│    product_id   │       │    content      │       │    type         │
│    created_at   │       │    is_read      │       │    amount       │
│    updated_at   │       │    created_at   │       │    status       │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### 3.4.2 Table Schemas

**Table 3.5: Database Schema Specifications**

| Table | Primary Key | Foreign Keys | Purpose |
|-------|-------------|--------------|---------|
| student | id (UUID) | auth.users(id) | Stores user profile information |
| ProductTable | product_id | seller_id → student(id) | Product listings |
| cart | id | user_id, product_id | Shopping cart items |
| orders | order_id | buyer_id → student(id) | Purchase orders |
| order_items | order_item_id | order_id, product_id, seller_id | Individual order line items |
| reviews | review_id | product_id, user_id | Product reviews |
| conversations | id | buyer_id, seller_id | Message threads |
| messages | id | conversation_id, sender_id | Individual messages |
| transactions | transaction_id | user_id, order_id | Payment records |
| purchases | id | user_id | Purchase history |
| purchase_items | id | purchase_id | Purchase line items |

### 3.4.3 Data Integrity Constraints

The database implements several integrity mechanisms:

- **Primary Keys**: UUID generation ensures globally unique identifiers
- **Foreign Keys**: Referential integrity with CASCADE delete where appropriate
- **Row Level Security (RLS)**: Supabase policies restrict data access by user
- **Check Constraints**: Price must be positive; rating between 1-5
- **Not Null Constraints**: Required fields enforced at database level

---

## 3.5 User Interface Design

### 3.5.1 Design Principles

The UI design follows established usability heuristics (Nielsen, 1994):

1. **Visibility of System Status** - Loading indicators, success/error messages
2. **Match Between System and Real World** - Familiar e-commerce conventions
3. **User Control and Freedom** - Easy navigation, undo capabilities
4. **Consistency and Standards** - Uniform styling, predictable interactions
5. **Error Prevention** - Form validation, confirmation dialogs
6. **Recognition Rather Than Recall** - Clear labels, visible options
7. **Flexibility and Efficiency** - Search, filters, quick actions
8. **Aesthetic and Minimalist Design** - Clean layout, focused content

### 3.5.2 Information Architecture

The site structure follows a hub-and-spoke model centred on the landing page (Rosenfeld & Morville, 2002):

**Figure 3.4: Site Map**

```
                            ┌─────────────────┐
                            │   Login Page    │
                            │   (index.html)  │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  Landing Page   │
                            │ (landingpage)   │
                            └────────┬────────┘
                                     │
        ┌────────────┬───────────────┼───────────────┬────────────┐
        │            │               │               │            │
        ▼            ▼               ▼               ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐
│Product Search│ │   Cart   │ │   Profile    │ │ Messages │ │ Sell Item│
│   Results    │ │          │ │              │ │          │ │          │
└──────┬───────┘ └────┬─────┘ └──────┬───────┘ └──────────┘ └──────────┘
       │              │              │
       ▼              ▼              ├──────────────┬──────────────┐
┌──────────────┐ ┌──────────┐       ▼              ▼              ▼
│   Product    │ │ Checkout │ ┌──────────┐  ┌──────────┐  ┌──────────┐
│   Details    │ │ (Stripe) │ │ Purchase │  │   My     │  │ Account  │
└──────────────┘ └────┬─────┘ │ History  │  │ Listings │  │ Settings │
                      │       └──────────┘  └──────────┘  └──────────┘
                      ▼
               ┌──────────────┐
               │Order Success │
               └──────────────┘
```

### 3.5.3 Wireframes

Low-fidelity wireframes were created to establish layout and content hierarchy before visual design (Garrett, 2011).

**Figure 3.5: Landing Page Wireframe**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  LOGO          [Search Bar........................] 🔍  👤 Profile  🛒  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │                         HERO SECTION                                    │ │
│ │                  "Buy & Sell Student Items"                             │ │
│ │                                                                         │ │
│ │              [Start Shopping]    [List Your Items]                      │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   Categories:  [Books] [Electronics] [Clothing] [Furniture] [Other]        │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  FEATURED PRODUCTS                                                      │ │
│ │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │ │
│ │  │  Image  │  │  Image  │  │  Image  │  │  Image  │                    │ │
│ │  │         │  │         │  │         │  │         │                    │ │
│ │  ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤                    │ │
│ │  │ Title   │  │ Title   │  │ Title   │  │ Title   │                    │ │
│ │  │ £XX.XX  │  │ £XX.XX  │  │ £XX.XX  │  │ £XX.XX  │                    │ │
│ │  │[Add Cart│  │[Add Cart│  │[Add Cart│  │[Add Cart│                    │ │
│ │  └─────────┘  └─────────┘  └─────────┘  └─────────┘                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  FOOTER: About | Privacy | Terms | Safety Tips                          │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Figure 3.6: Shopping Cart Wireframe**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  LOGO          [Search Bar........................] 🔍  👤 Profile  🛒  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  🛒 Your Cart (3 items)                                                    │
│                                                                             │
│ ┌────────────────────────────────────────┐  ┌───────────────────────────┐  │
│ │  CART ITEMS                            │  │  ORDER SUMMARY            │  │
│ │  ┌──────────────────────────────────┐  │  │                           │  │
│ │  │ [IMG] Item Title                 │  │  │  Subtotal (3 items)       │  │
│ │  │       Seller: John               │  │  │                   £45.00  │  │
│ │  │       £15.00    [-] 1 [+]  [X]   │  │  │                           │  │
│ │  └──────────────────────────────────┘  │  │  ─────────────────────    │  │
│ │  ┌──────────────────────────────────┐  │  │  Total            £45.00  │  │
│ │  │ [IMG] Item Title                 │  │  │                           │  │
│ │  │       Seller: Jane               │  │  │  ┌─────────────────────┐  │  │
│ │  │       £20.00    [-] 1 [+]  [X]   │  │  │  │  💳 Pay with Stripe │  │  │
│ │  └──────────────────────────────────┘  │  │  └─────────────────────┘  │  │
│ │  ┌──────────────────────────────────┐  │  │                           │  │
│ │  │ [IMG] Item Title                 │  │  │  [← Continue Shopping]    │  │
│ │  │       Seller: Alex               │  │  │                           │  │
│ │  │       £10.00    [-] 1 [+]  [X]   │  │  │  🔒 Secure Payments       │  │
│ │  └──────────────────────────────────┘  │  └───────────────────────────┘  │
│ └────────────────────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.5.4 Visual Design System

A consistent design system was established:

**Colour Palette:**
- Primary: `#667eea` (Purple gradient) - CTAs, branding
- Secondary: `#764ba2` (Deep purple) - Hover states
- Success: `#10b981` (Green) - Confirmations
- Warning: `#f59e0b` (Amber) - Alerts
- Error: `#ef4444` (Red) - Error states
- Neutral: `#1f2937` (Dark grey) - Text

**Typography:**
- Primary Font: 'Segoe UI', system-ui, sans-serif
- Headings: Bold, hierarchical sizing (32px → 14px)
- Body: Regular, 16px, 1.6 line-height

**Components:**
- Buttons: Rounded corners (8px), gradient backgrounds
- Cards: White background, subtle shadows, rounded corners (20px)
- Forms: Floating labels, clear validation states

---

## 3.6 Sequence Diagrams

### 3.6.1 User Authentication Sequence

**Figure 3.7: Sign In Sequence Diagram**

```
┌──────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│Client│          │  Server  │          │ Supabase │          │  Auth    │
└──┬───┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
   │                   │                     │                     │
   │  POST /signin     │                     │                     │
   │  {email,password} │                     │                     │
   │──────────────────>│                     │                     │
   │                   │                     │                     │
   │                   │  signInWithPassword │                     │
   │                   │────────────────────>│                     │
   │                   │                     │                     │
   │                   │                     │   Verify credentials│
   │                   │                     │────────────────────>│
   │                   │                     │                     │
   │                   │                     │   Return JWT tokens │
   │                   │                     │<────────────────────│
   │                   │                     │                     │
   │                   │  {session, user}    │                     │
   │                   │<────────────────────│                     │
   │                   │                     │                     │
   │  {userID, tokens} │                     │                     │
   │<──────────────────│                     │                     │
   │                   │                     │                     │
   │ Store tokens in   │                     │                     │
   │ localStorage      │                     │                     │
   │                   │                     │                     │
```

### 3.6.2 Checkout Process Sequence

**Figure 3.8: Stripe Checkout Sequence Diagram**

```
┌──────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│Client│       │  Server  │       │  Stripe  │       │ Database │
└──┬───┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
   │                │                  │                  │
   │ Click Checkout │                  │                  │
   │───────────────>│                  │                  │
   │                │                  │                  │
   │                │ Get cart items   │                  │
   │                │─────────────────────────────────────>
   │                │                  │                  │
   │                │ Cart items       │                  │
   │                │<─────────────────────────────────────
   │                │                  │                  │
   │                │ Create order     │                  │
   │                │─────────────────────────────────────>
   │                │                  │                  │
   │                │ Create Checkout  │                  │
   │                │ Session          │                  │
   │                │─────────────────>│                  │
   │                │                  │                  │
   │                │ Session URL      │                  │
   │                │<─────────────────│                  │
   │                │                  │                  │
   │ Redirect to    │                  │                  │
   │ Stripe Checkout│                  │                  │
   │<───────────────│                  │                  │
   │                │                  │                  │
   │ Complete payment on Stripe        │                  │
   │──────────────────────────────────>│                  │
   │                │                  │                  │
   │ Redirect to    │                  │                  │
   │ success page   │                  │                  │
   │<──────────────────────────────────│                  │
   │                │                  │                  │
   │ Verify payment │                  │                  │
   │───────────────>│                  │                  │
   │                │                  │                  │
   │                │ Retrieve session │                  │
   │                │─────────────────>│                  │
   │                │                  │                  │
   │                │ Payment confirmed│                  │
   │                │<─────────────────│                  │
   │                │                  │                  │
   │                │ Update order,    │                  │
   │                │ credit sellers   │                  │
   │                │─────────────────────────────────────>
   │                │                  │                  │
   │                │ Send emails      │                  │
   │                │                  │                  │
   │ Order confirmed│                  │                  │
   │<───────────────│                  │                  │
```

---

## 3.7 Security Design

### 3.7.1 Authentication and Authorisation

The system implements a multi-layered security approach:

1. **Password Security**: Passwords hashed using bcrypt via Supabase Auth
2. **Session Management**: JWT tokens with automatic refresh
3. **API Protection**: Server-side session validation for protected endpoints
4. **Row Level Security**: Database policies restrict data access by user ID

### 3.7.2 Payment Security

Payment security is delegated to Stripe, ensuring:

- **PCI-DSS Compliance**: Card details never touch our servers
- **Tokenisation**: Sensitive data replaced with secure tokens
- **Webhook Verification**: Signed webhooks prevent tampering
- **HTTPS Only**: All payment communications encrypted

### 3.7.3 Input Validation

All user inputs are validated:

- **Client-side**: Immediate feedback using HTML5 validation
- **Server-side**: Express middleware sanitises inputs
- **Database**: Constraints enforce data integrity

---

## 3.8 Design Decisions and Trade-offs

### 3.8.1 Server-Side Rendering vs. Single Page Application

**Decision**: Traditional server-rendered pages with client-side enhancements

**Rationale**:
- Simpler architecture without framework complexity
- Better initial page load performance
- Improved SEO for product listings
- Lower learning curve for maintenance

**Trade-off**: Less dynamic interactivity than React/Vue SPA

### 3.8.2 Backend-as-a-Service (Supabase) vs. Custom Backend

**Decision**: Supabase for database and authentication

**Rationale**:
- Reduced development time
- Built-in authentication system
- Real-time capabilities available
- Generous free tier for student project
- PostgreSQL reliability

**Trade-off**: Vendor lock-in; limited customisation

### 3.8.3 Integrated vs. Third-Party Payments

**Decision**: Stripe integration

**Rationale**:
- Industry-standard security
- Handles compliance requirements
- Excellent documentation
- Test mode for development
- Manages complex payment flows (refunds, disputes)

**Trade-off**: Transaction fees (2.9% + 30p per transaction)

---

## 3.9 Summary

This chapter has presented a comprehensive specification and design for the StudentHub e-commerce platform. The requirements phase identified 13 functional requirements and 10 non-functional requirements through systematic stakeholder analysis and use case modelling. The system architecture follows a proven three-tier model, with technology choices justified based on technical merit and project constraints.

The database design implements normalised schemas with appropriate integrity constraints, while the UI design follows established usability heuristics. Security considerations are addressed through defence-in-depth strategies, with particular attention to payment security through Stripe integration.

The design decisions documented here reflect careful consideration of trade-offs between development speed, maintainability, and functionality, appropriate for a student marketplace application.

---

## References

Booch, G., Rumbaugh, J. and Jacobson, I. (1999) *The Unified Modeling Language User Guide*. Reading, MA: Addison-Wesley.

Chung, L., Nixon, B.A., Yu, E. and Mylopoulos, J. (2000) *Non-Functional Requirements in Software Engineering*. Boston: Kluwer Academic Publishers.

Cockburn, A. (2001) *Writing Effective Use Cases*. Boston: Addison-Wesley.

Codd, E.F. (1970) 'A Relational Model of Data for Large Shared Data Banks', *Communications of the ACM*, 13(6), pp. 377-387.

Cohn, M. (2004) *User Stories Applied: For Agile Software Development*. Boston: Addison-Wesley.

Eckerson, W.W. (1995) 'Three Tier Client/Server Architecture: Achieving Scalability, Performance, and Efficiency in Client Server Applications', *Open Information Systems*, 10(1), pp. 3-20.

Fielding, R.T. (2000) *Architectural Styles and the Design of Network-based Software Architectures*. PhD thesis. University of California, Irvine.

Garrett, J.J. (2011) *The Elements of User Experience: User-Centered Design for the Web and Beyond*. 2nd edn. Berkeley: New Riders.

IEEE (1998) *IEEE Recommended Practice for Software Requirements Specifications*. IEEE Std 830-1998.

Martin, R.C. (2017) *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Boston: Prentice Hall.

Mozilla (2023) *MDN Web Docs*. Available at: https://developer.mozilla.org (Accessed: 27 January 2026).

Nielsen, J. (1994) 'Enhancing the Explanatory Power of Usability Heuristics', *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems*, pp. 152-158.

Preece, J., Rogers, Y. and Sharp, H. (2015) *Interaction Design: Beyond Human-Computer Interaction*. 4th edn. Chichester: Wiley.

Rosenfeld, L. and Morville, P. (2002) *Information Architecture for the World Wide Web*. 2nd edn. Sebastopol: O'Reilly Media.

Sommerville, I. (2016) *Software Engineering*. 10th edn. Harlow: Pearson Education.

Tilkov, S. and Vinoski, S. (2010) 'Node.js: Using JavaScript to Build High-Performance Network Programs', *IEEE Internet Computing*, 14(6), pp. 80-83.
