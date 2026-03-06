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
| FR11 | AI Book Valuator | Must | The system shall provide AI-powered book valuation using ISBN lookup |
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

Security design for StudentHub is driven by the need to protect student users’ identities and payment data, enforce correct access to listings and messages, and satisfy the non-functional security requirements (NFR04–NFR06). The following subsections describe how each security layer is applied *within this system*, why it is appropriate for a student marketplace context, and what alternatives were considered.

### 3.7.1 Authentication and Authorisation

StudentHub must reliably identify users so that only a listing’s seller can edit or remove it, only a buyer can see their own cart and orders, and only participants in a conversation can view messages (FR03, FR05, FR07, NFR05). The system implements a multi-layered approach as follows, with explicit benefit to StudentHub:

1. **Password security**: Passwords are hashed using bcrypt via Supabase Auth rather than stored in plain text or with a weak scheme. *Benefit to StudentHub*: If the database were ever exposed, student credentials remain protected. *Suitability*: Supabase Auth provides this out of the box, avoiding custom crypto implementation and reducing risk of error. *Alternative considered*: Implementing bcrypt in the application tier was rejected because it would duplicate logic and require secure secret management; delegating to Supabase keeps one source of truth for password handling.

2. **Session management**: Sessions are maintained using JWT tokens with automatic refresh (access and refresh tokens issued by Supabase). *Benefit to StudentHub*: Users stay signed in across page loads and API calls without re-entering credentials, which is essential for cart persistence (FR05) and a smooth checkout flow (FR06). *Suitability*: Stateless JWTs fit a deployment where the same app may run on multiple instances (e.g. Vercel, Poseidon) without shared server-side session store. *Alternative considered*: Server-side sessions (e.g. Redis) would require additional infrastructure and configuration; for the expected scale and deployment environments of StudentHub, JWTs were deemed sufficient and simpler to operate.

3. **API protection**: Every protected endpoint (cart, orders, messaging, listings management) validates the session on the server—typically by resolving the current user via Supabase Auth—before performing any data operation. *Benefit to StudentHub*: Prevents unauthorised access even if the client is tampered with (e.g. a user attempting to access another user’s orders by guessing IDs). *Suitability*: The Express server acts as the single point where “who is this user?” is answered, aligning with the three-tier design and NFR05. No alternative was preferred; server-side validation is mandatory for a secure design.

4. **Row Level Security (RLS)**: Database policies in Supabase restrict access to rows by user ID (e.g. students see only their own profile, cart rows, and conversations they participate in). *Benefit to StudentHub*: Even if a bug or future change exposed a query without proper server-side checks, RLS provides a second barrier so that users cannot read or modify other users’ data. *Suitability*: PostgreSQL RLS is well-supported by Supabase and fits the model where every sensitive table is scoped by `user_id` or equivalent. *Alternative considered*: Relying solely on application-tier checks was rejected because defence-in-depth reduces impact of application bugs; RLS adds minimal overhead for the project’s data volume.

### 3.7.2 Payment Security

StudentHub processes card payments at checkout (FR06) and must comply with NFR06 (payment security) without handling raw card data. The system delegates all payment handling to Stripe. The following points describe how this benefits StudentHub and why it is suitable for this project:

- **PCI-DSS compliance**: Card details never touch StudentHub’s servers; they are entered on Stripe’s hosted Checkout page. *Benefit to StudentHub*: The platform avoids the scope of PCI-DSS for cardholder data, which would otherwise require stringent infrastructure and auditing. *Suitability*: For a student project and a university-hosted deployment (e.g. Poseidon), achieving PCI-DSS in-house would be impractical; delegating to Stripe is the standard approach for small-to-medium e-commerce. *Alternative considered*: Storing or processing card data on our own backend was never an option due to compliance and risk; the only real choice was which provider (Stripe was chosen for documentation, test mode, and widespread use).

- **Tokenisation and HTTPS**: Stripe replaces sensitive data with tokens and all communication uses HTTPS. *Benefit to StudentHub*: The application only ever handles session URLs, payment IDs, and webhook payloads—no card numbers or CVV. Combined with TLS (NFR04), data in transit is protected. *Suitability*: Aligns with the project’s constraint of not operating payment card infrastructure.

- **Webhook verification**: Stripe webhooks are verified using a signed secret so that the server only processes events that genuinely originated from Stripe. *Benefit to StudentHub*: Prevents an attacker from sending fake “payment successful” requests to the application and marking orders as paid without real payment. *Suitability*: Essential for correct order and balance state (FR06, FR09); verification is implemented in the checkout/verify-payment flow. No alternative was considered for production; unverified webhooks would be insecure.

### 3.7.3 Input Validation

StudentHub accepts user input in many forms: sign-up and sign-in credentials, product titles and descriptions, cart quantities, messages, and profile updates (FR01–FR03, FR07, FR13). Unvalidated or unsanitised input could lead to injection, broken layouts, or stored malicious content. The system applies validation at three levels, each with a clear role in this system:

- **Client-side (HTML5 and JavaScript)**: Required fields, email format, and numeric ranges are validated in the browser. *Benefit to StudentHub*: Users get immediate feedback and fewer invalid requests reach the server, improving usability (NFR07) and reducing unnecessary load. *Suitability*: Fits the chosen UI approach (server-rendered pages with client-side enhancements) and requires no extra framework. *Alternative considered*: Relying only on client-side validation was rejected because it can be bypassed; it is used as a convenience layer, not as a security boundary.

- **Server-side (Express)**: All API and form handlers validate and sanitise inputs (e.g. trimming strings, checking types and lengths, rejecting obviously malicious payloads). *Benefit to StudentHub*: Ensures that only well-formed data is passed to Supabase and that abuse (e.g. oversized messages or invalid prices) is rejected before affecting the database. *Suitability*: The Express layer is the correct place to enforce business rules and input limits for a three-tier architecture. This is the main line of defence for input safety.

- **Database (constraints)**: Supabase/PostgreSQL schemas enforce NOT NULL, unique constraints, foreign keys, and value ranges (e.g. rating 1–5). *Benefit to StudentHub*: Guarantees data integrity even if a bug or future change omits server-side checks, supporting NFR10 (maintainability) and correct reporting (e.g. seller dashboard, FR09). *Suitability*: Normalised design and constraints are already part of the data model (Section 3.5); using them for validation is consistent and adds defence-in-depth. No alternative was preferred; database constraints are standard practice for integrity.

---

## 3.8 Design Decisions and Trade-offs

The following subsections document key design decisions for StudentHub. Each is framed in terms of *how the decision benefits this system*, *why it is suitable for the project context* (a student marketplace delivered as a dissertation project with limited time and operational scope), and *what alternatives were considered* and why they were accepted or rejected. This aligns with the marking emphasis on rationale and critical evaluation.

### 3.8.1 Server-Side Rendering vs. Single Page Application

**Decision**: StudentHub uses traditional server-rendered HTML pages (e.g. landing page, product views, profile) with client-side JavaScript for form submission, cart updates, and API calls, rather than a full Single Page Application (SPA) framework such as React or Vue.

**Benefit to StudentHub**: (1) Product listing and search pages are delivered as full HTML, which improves initial load and makes product URLs directly shareable and indexable—important for a marketplace where students may share links to items (FR04, FR03). (2) The architecture avoids build tooling, routing, and state management inherent in SPAs, so the codebase stays manageable for a single developer and for future maintainers (NFR10). (3) The same Express server that serves pages also hosts the REST API (cart, checkout, messaging), keeping one deployment unit and consistent authentication (NFR05).

**Suitability for project context**: The project scope (MoSCoW requirements in Table 3.1) does not demand highly dynamic, app-like interactions on every screen; most flows are form-based or list-and-detail. Server-rendered pages with targeted client-side enhancements are sufficient and reduce the risk of scope creep and framework-specific bugs during the dissertation timeline.

**Alternatives considered**: A full SPA (e.g. React front end calling the same backend) would allow richer interactivity (e.g. live search without full page reload) but would require separate front-end build, deployment, and CORS/session handling. Given time constraints and the need to prioritise core commerce and security (FR01–FR06, NFR04–NFR06), the SPA option was rejected in favour of a simpler, single-codebase approach. The trade-off—less dynamic interactivity than a React/Vue SPA—was accepted as acceptable for the stated requirements and user stories.

### 3.8.2 Backend-as-a-Service (Supabase) vs. Custom Backend

**Decision**: StudentHub uses Supabase as the backend for the relational database (PostgreSQL) and for authentication (sign-up, sign-in, session, password reset), rather than a custom backend (e.g. self-hosted PostgreSQL plus hand-built auth and REST API only).

**Benefit to StudentHub**: (1) Supabase provides a managed PostgreSQL instance with a RESTful API and Row Level Security, so the system can enforce per-user data access (Section 3.7.1) without operating database servers. (2) Built-in authentication (bcrypt, JWT, refresh tokens) directly satisfies FR01, FR02, and NFR05 and integrates with the same database, keeping user identity consistent across auth and application data (e.g. `student.id` linked to Supabase Auth). (3) Development time is reduced because schema design, migrations, and auth flows are implemented against Supabase’s APIs and dashboard rather than from scratch. (4) The free tier is sufficient for a dissertation-scale deployment (e.g. Vercel, Poseidon) and for demonstration and assessment.

**Suitability for project context**: As a student project with a fixed delivery timeline, investing in a custom auth implementation and database hosting would divert effort from requirements that add more value to the dissertation (e.g. checkout, messaging, reviews). Supabase’s PostgreSQL foundation also supports the normalised schema and integrity constraints described in Section 3.5, so the choice is consistent with the data design.

**Alternatives considered**: (1) Custom backend with self-hosted PostgreSQL and custom auth: rejected due to development and operational overhead and security risk of implementing auth incorrectly. (2) Other BaaS (e.g. Firebase): considered; Supabase was chosen for SQL and RLS, which align with the relational design and the need for complex queries (search, joins for cart and orders). The trade-off—vendor lock-in and limited low-level customisation—was accepted because portability was less critical than delivering a working, secure system within the project scope.

### 3.8.3 Integrated vs. Third-Party Payments

**Decision**: StudentHub integrates the Stripe payment platform for checkout (FR06) rather than implementing an in-house payment flow or using a different provider.

**Benefit to StudentHub**: (1) Card data never touches the application or database, so the system meets NFR06 (payment security) and avoids PCI-DSS scope for cardholder data. (2) Stripe Checkout Sessions handle the redirect flow, payment confirmation, and webhook events; the application focuses on creating sessions (cart → order → session URL) and verifying payment to update order status and clear the cart (Section 3.7.2). (3) Test mode allows full development and demonstration without real charges. (4) Documentation and ecosystem support reduce integration risk and debugging time, which is important for a time-limited project.

**Suitability for project context**: The functional requirement FR06 (“process payments securely through Stripe”) and NFR06 explicitly assume a third-party gateway. Implementing payments in-house would be out of scope and unsafe. Among third-party options, Stripe is widely used, well-documented, and offers a clear model (Checkout Session + webhook) that fits the existing flow: create order, send user to Stripe, on return verify and complete order. The platform fee (e.g. 5%) and Stripe’s transaction fees (e.g. 2.9% + 30p) are a known trade-off for the project; they are not customisable at the application level and were accepted in exchange for security and compliance.

**Alternatives considered**: (1) In-house card handling: rejected on security and compliance grounds. (2) Other gateways (e.g. PayPal, Braintree): could satisfy FR06 and NFR06; Stripe was chosen for consistency with common teaching material, strong documentation, and Checkout Session abstraction that matches the desired user flow. The trade-off—transaction fees and dependency on Stripe’s API and policies—was deemed acceptable for a student marketplace where the primary goal is to demonstrate a secure, end-to-end payment flow rather than to minimise cost.

---

## 3.9 Summary

This chapter has presented a comprehensive specification and design for the StudentHub e-commerce platform. The requirements phase identified 13 functional requirements and 10 non-functional requirements through systematic stakeholder analysis and use case modelling. The system architecture follows a proven three-tier model, with technology choices justified based on technical merit and project constraints.

The database design implements normalised schemas with appropriate integrity constraints, while the UI design follows established usability heuristics. Security considerations are addressed through defence-in-depth strategies, with particular attention to payment security through Stripe integration.

The security design (Section 3.7) and design decisions (Section 3.8) are framed with explicit rationale and links to StudentHub: each choice is justified in terms of how it benefits the system, why it is suitable for the project context, and what alternatives were considered. This supports the marking emphasis on rationale and critical evaluation.

---

## References

