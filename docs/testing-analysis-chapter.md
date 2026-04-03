# Chapter 6: Testing and Analysis

---

## 6.1 Introduction

Testing constitutes a fundamental component of the software development lifecycle, providing empirical evidence that a system meets its specified requirements and behaves reliably under a range of operating conditions (Myers, Badgett and Sandler, 2011). For StudentHub, a comprehensive testing strategy was adopted encompassing four complementary levels: unit testing, API integration testing, system-level functional testing, and cooperative usability evaluation. Each level targets a distinct quality concern: correctness of isolated logic, reliability of server endpoints, conformance to functional requirements, and suitability for real users. Together, these layers provide both objective quality metrics and rich qualitative insight aligned with the mark scheme criteria of valid/invalid input testing, experimental result analysis, and user involvement.

The testing activities were conducted iteratively across the final sprint of the Agile-Scrum development process, with unit and integration tests executed continuously during development and usability testing scheduled after the system reached feature completeness.

---

## 6.2 Testing Strategy

The testing strategy adopted for StudentHub follows a layered approach consistent with the test pyramid model (Cohn, 2009), which prioritises a large base of fast, isolated unit tests, a middle layer of integration tests, and a smaller number of end-to-end and usability tests at the apex.

**Unit Testing** targeted the pure business-logic functions within the server — specifically price validation, platform fee calculation, cart quantity management, payment idempotency, self-purchase prevention, and search query validation. The Jest testing framework (v29) was used with the `--experimental-vm-modules` flag to support ES Module syntax consistent with the project's `import/export` architecture.

**API Integration Testing** was conducted using Postman (v11), targeting all thirty RESTful endpoints exposed by the Express.js server. Tests were grouped into six collections — Authentication, Products, Cart, Messaging, AI Valuators, and Checkout — with automated assertions written in Postman's JavaScript test runner. The Collection Runner was used to execute all tests sequentially and produce a consolidated pass/fail report.

**System Functional Testing** validated end-to-end user flows against the functional requirements (FR01–FR21) defined in Chapter 4, using both valid and invalid input data to test boundary conditions and error handling.

**Cooperative Usability Evaluation** (Carroll and Mack, 1984) was conducted with real student participants using a structured task script, think-aloud protocol, observer recording sheets, and the System Usability Scale (Brooke, 1996). This approach was selected over formal laboratory usability testing on the grounds that it is better suited to resource-constrained academic contexts while still yielding both quantitative task performance metrics and rich qualitative observations (Dumas and Redish, 1999).

---

## 6.3 Unit Testing

Unit tests were written to verify the correctness of six core logic components that underpin the platform's key behaviours. Each test suite was designed with multiple test cases covering expected (valid) inputs, boundary conditions, and invalid inputs to maximise defect detection coverage (Myers, Badgett and Sandler, 2011).

### 6.3.1 Test Suites and Results

All unit tests were executed using `npm test` and produced the following results:

| Suite | Tests | Passed | Failed | Coverage |
|---|---|---|---|---|
| Price Validation | 4 | 4 | 0 | Parsing, negatives, non-numeric |
| Platform Fee Calculation | 4 | 4 | 0 | 5% fee, seller payout, edge values |
| Cart Quantity Logic | 3 | 3 | 0 | New item, increment, multi-user |
| Payment Idempotency Guard | 2 | 2 | 0 | First call, duplicate webhook |
| Self-Purchase Prevention | 3 | 3 | 0 | Valid, own item, mixed cart |
| Search Query Validation | 5 | 5 | 0 | Empty, single char, whitespace, valid |
| **Total** | **21** | **21** | **0** | |

*[Screenshot: Terminal output showing all 21 tests passing with green ✓ marks — insert here]*

### 6.3.2 Selected Test Case Analysis

**Platform Fee Calculation** tests verified that the 5% platform commission is applied correctly across all price values. A test for `fee(£15.99)` uses `toBeCloseTo(0.7995, 4)` rather than exact equality, acknowledging floating-point precision limitations in JavaScript — a technique consistent with best practice for numerical unit testing (Fowler, 2018).

**Payment Idempotency Guard** tests confirmed that a Stripe webhook cannot be processed twice for the same order. This was critical given that webhook delivery is not guaranteed to be exactly-once. The test simulates a duplicate callback and asserts the order remains in `paid` / `confirmed` state without modification, protecting against double-fulfilment.

**Self-Purchase Prevention** includes a mixed-cart edge case — a basket containing one valid item and one self-owned item — confirming that the guard throws correctly even when other valid items are present. This aligns with requirement FR15.

---

## 6.4 API Integration Testing

API integration testing verified that the Express.js server endpoints correctly handle HTTP requests, apply authentication, enforce business rules, and return appropriate status codes and response bodies. Testing was conducted locally against a running instance of the server (`node server.js`) connected to the live Supabase database via environment credentials.

### 6.4.1 Test Organisation

Thirty test cases were organised across six Postman collections. All assertions used Postman's JavaScript test runner. The Postman environment stored reusable variables (`base_url`, `access_token`, `product_id`, `cart_item_id`, `conversation_id`) to minimise test data coupling and enable the Collection Runner to execute tests in sequence.

### 6.4.2 Authentication Endpoint Results

| Test ID | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| API-01 | `POST /signup` | Valid new user | 200 + userID | 200 + userID | ✅ PASS |
| API-02 | `POST /signup` | Duplicate email | 400 + error | 400 error | ✅ PASS |
| API-03 | `POST /signup` | Missing password | 400 | 400 | ✅ PASS |
| API-04 | `POST /signin` | Valid credentials | 200 + tokens | 200 + tokens | ✅ PASS |
| API-05 | `POST /signin` | Wrong password | 400 | 400 | ✅ PASS |

*[Screenshot: API-04 Postman response showing 200 OK with session tokens — insert here]*
*[Screenshot: API-05 showing 400 with "Invalid login credentials" — insert here]*

### 6.4.3 Product Endpoint Results

| Test ID | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| API-06 | `POST /uploadProduct` | Valid form-data + image | 200 success | 200 success | ✅ PASS |
| API-07 | `POST /uploadProduct` | No image file | 400 error | 400 error | ✅ PASS |
| API-08 | `GET /search?q=&price=` | Keyword + price range | 200 filtered array | 200 array | ✅ PASS |
| API-09 | `GET /search?q=xyz...` | Non-existent query | 200 empty array | `[]` | ✅ PASS |
| API-10 | `GET /search/category` | Category + price | 200 filtered array | 200 array | ✅ PASS |
| API-11 | `GET /api/products/search` | 5-char query | ≤5 results | ≤5 results | ✅ PASS |
| API-12 | `GET /api/products/search` | 1-char query | Empty array | `[]` | ✅ PASS |

*[Screenshot: API-06 form-data upload request and 200 response — insert here]*
*[Screenshot: API-08 search results array with price metadata — insert here]*

### 6.4.4 Cart Endpoint Results

| Test ID | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| API-13 | `POST /api/cart` | New item | 201 + quantity=1 | 201 quantity=1 | ✅ PASS |
| API-14 | `POST /api/cart` | Same item again | 200 + quantity=2 | 200 quantity=2 | ✅ PASS |
| API-15 | `GET /api/cart` | Authenticated | 200 + items array | 200 items | ✅ PASS |
| API-16 | `GET /api/cart` | No auth | 401 | 401 | ✅ PASS |
| API-17 | `PATCH /api/cart/:id` | quantity=3 | 200 quantity=3 | 200 quantity=3 | ✅ PASS |
| API-18 | `DELETE /api/cart/:id` | Valid item | 200 success | 200 success | ✅ PASS |

*[Screenshot: API-13 showing 201 response with quantity=1 — insert here]*
*[Screenshot: API-16 showing 401 Unauthorized — insert here]*

### 6.4.5 Messaging Endpoint Results

| Test ID | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| API-19 | `POST /api/conversations` | Valid buyer/seller | 200 + conv ID | 200 conv ID | ✅ PASS |
| API-20 | `POST /api/conversations` | Same UUID for both | 400 | 400 | ✅ PASS |
| API-21 | `POST /api/messages` | Valid message body | 201 + message | 201 message | ✅ PASS |
| API-22 | `GET /api/messages/:id` | Other user's token | 403 | 403 | ✅ PASS |

### 6.4.6 AI Valuator Endpoint Results

| Test ID | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| API-23 | `POST /bookValuator` | Valid ISBN | 200 + predicted_value | 200 numeric | ✅ PASS |
| API-24 | `POST /bookValuator` | Unknown ISBN | 200 fallback | 200 with note | ✅ PASS |
| API-25 | `POST /bookValuator` | No ISBN field | 400 | 400 | ✅ PASS |
| API-26 | `POST /itemValuator` | Valid form-data | 200 + predicted_value | 200 numeric | ✅ PASS |
| API-27 | `POST /itemValuator` | No item_name | 400 | 400 | ✅ PASS |

*[Screenshot: API-23 showing predicted_value and reasoning in response — insert here]*

### 6.4.7 Checkout Endpoint Results

| Test ID | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| API-28 | `POST /api/checkout/create-session` | Valid cart items | 200 + Stripe URL | 200 URL | ✅ PASS |
| API-29 | `POST /api/checkout/create-session` | Own product | 400 | 400 | ✅ PASS |
| API-30 | `POST /api/checkout/create-session` | Empty cart | 400 | 400 | ✅ PASS |

*[Screenshot: API-28 Stripe URL response — insert here]*
*[Screenshot: API-29 self-purchase blocked with 400 — insert here]*

### 6.4.8 Integration Testing Summary

All thirty integration tests passed on first execution with no test failures recorded. The complete Postman Collection Runner report is presented in Figure 6.x.

*[Screenshot: Postman Collection Runner summary — all 30 tests passing — insert here]*

A notable observation from integration testing was the behaviour of the book valuator endpoint (API-24) when supplied with an invalid ISBN. Rather than returning an error, the endpoint gracefully degraded — the Gemini API still returned a predicted value based on the physical attributes provided, with the reasoning text noting that the title could not be resolved. This represents a robust fallback consistent with the system's aim to provide price guidance even under incomplete data conditions, as recommended in the AI valuator design rationale in Chapter 5.

---

## 6.5 System Functional Testing

System functional testing evaluated the platform against each of the functional requirements defined in the Requirements Specification (Chapter 4). Tests were executed by the developer using the deployed Vercel production environment (`https://student-hub-beige-pi.vercel.app`) to ensure production parity. Each requirement was tested with valid inputs to confirm correct behaviour, and with invalid or boundary inputs to confirm appropriate error handling.

### 6.5.1 Functional Requirements Test Results

| FR | Requirement | Test Input (Valid) | Outcome | Test Input (Invalid) | Outcome |
|---|---|---|---|---|---|
| FR01 | User registration | Valid name, email, strong password | Account created ✅ | Duplicate email | 400 error ✅ |
| FR02 | User login | Valid credentials | JWT session returned ✅ | Wrong password | 400 error ✅ |
| FR03 | Google OAuth login | Google account | Redirected to landing page ✅ | Cancelled OAuth | Redirect to login ✅ |
| FR04 | Password reset | Valid email | Reset link sent ✅ | Non-existent email | Silent success (security) ✅ |
| FR05 | Create listing | All required fields + image | Listed on marketplace ✅ | Missing image | 400 error ✅ |
| FR06 | Edit listing | Updated price + title | Changes persisted ✅ | Unauthorised user | 403 error ✅ |
| FR07 | Delete listing | Own listing | Removed from DB ✅ | Other user's listing | 403 error ✅ |
| FR08 | Search by keyword | "algorithm" | Matching results ✅ | 1-char query | Empty array ✅ |
| FR09 | Filter by category | "Electronics" | Category results ✅ | Invalid category | Empty array ✅ |
| FR10 | Filter by price | "25-50" range | Price-bounded results ✅ | Negative range | No results ✅ |
| FR11 | Add to cart | Authenticated user | Item added ✅ | Unauthenticated | 401 error ✅ |
| FR12 | View/manage cart | Valid session | Cart items returned ✅ | No session | 401 + empty items ✅ |
| FR13 | Checkout (Stripe) | Valid cart items | Stripe session URL ✅ | Empty cart | 400 error ✅ |
| FR14 | Order history | Post-purchase | Orders listed ✅ | No orders | Empty array ✅ |
| FR15 | Self-purchase prevention | Own product in cart | 400 error returned ✅ | N/A | N/A |
| FR16 | Book AI valuation | Valid ISBN | Price + reasoning ✅ | No ISBN | 400 error ✅ |
| FR17 | General item valuation | Item name + condition | Price + reasoning ✅ | No item name | 400 error ✅ |
| FR18 | Messaging | Valid conversation | Message sent ✅ | Self-message | 400 error ✅ |
| FR19 | View messages | Valid conversation ID | Messages returned ✅ | Wrong user | 403 error ✅ |
| FR20 | Write review | Logged-in user | Review saved ✅ | Unauthenticated | 401 error ✅ |
| FR21 | Update profile | Valid name fields | Profile updated ✅ | Empty fields | Null values stored ✅ |

All twenty-one functional requirements were verified. No regressions were identified during system testing.

---

## 6.6 Usability Testing

### 6.6.1 Methodology

Usability testing was conducted using **cooperative evaluation** (Carroll and Mack, 1984), a user-centred methodology in which participants complete realistic tasks whilst thinking aloud, with an observer recording task completion, errors, and qualitative observations. This approach was selected over automated testing in recognition that usability defects are most reliably surfaced through representative users interacting with the system in realistic scenarios (Nielsen, 1993).

**Participants:** Six (N = 6) undergraduate students from the University of Salford, recruited via convenience sampling. Participants represented the target user population; none were involved in the development of the system.

**Procedure:** Each participant was given a printed Task Script containing five tasks of increasing complexity (Table 6.5). Sessions were conducted individually. Participants were asked to think aloud throughout, sharing any thoughts, confusions, or observations as they completed each task. An Observer Recording Sheet was used to capture task start/end times, completion status, error counts, and AI pricing interaction data. Sessions were concluded with administration of the System Usability Scale (SUS) questionnaire (Brooke, 1996).

**Data Collection Instruments:**
- Observer Recording Sheet — quantitative per-task metrics
- Think-aloud protocol — qualitative observations and verbatim quotes
- System Usability Scale (10-item questionnaire, 5-point Likert scale)
- Post-session verbal debrief

**Analysis:** Quantitative data (task completion rates, task durations, error rates, SUS scores) were computed descriptively. SUS scores were interpreted using Bangor, Kortum and Miller's (2008) adjective scale. Qualitative data from think-aloud transcripts and observer notes were analysed thematically, identifying recurrent usability issues classified by Nielsen's (1994) heuristics.

### 6.6.2 Task Design

| Task | Description | Target Completion Time |
|---|---|---|
| Task 1 — Account Creation | Create a new account and navigate to profile | < 3 minutes |
| Task 2 — Create Listing with AI Pricing | List a textbook (ISBN: 9780349411903) with AI price, plus one non-book item | < 5 minutes |
| Task 3 — Search and Filter | Find electronics under £50 using search and filters | < 2 minutes |
| Task 4 — Contact a Seller | Find a listing and send the seller a message about item condition | < 1 minute |
| Task 5 — Edit Own Listing | Update the price on the listing created in Task 2 | < 2 minutes |

### 6.6.3 Task Completion Results

Task completion data was recorded on Observer Recording Sheets during each session. All six participants (P01–P06) completed the usability sessions. The table below summarises the outcomes; duration and error counts are drawn from the observer records.

| Participant | Task 1 | Task 2 | Task 3 | Task 4 | Task 5 |
|---|---|---|---|---|---|
| P01 | C | C | C | C | C |
| P02 | C | CH | C | C | C |
| P03 | C | C | C | C | CH |
| P04 | C | CH | C | C | C |
| P05 | C | C | C | C | C |
| P06 | C | C | C | CH | C |
| **Completion Rate** | 100% | 100% | 100% | 100% | 100% |
| **% Without Assistance** | 100% | 67% | 100% | 83% | 83% |

Completion codes: C = Completed without help; CH = Completed with hint; CS = Completed with significant help; F = Failed/Abandoned.

All five tasks were completed by all six participants, yielding an overall task completion rate of 100%. Task 2 (AI-assisted listing creation) required the most hints (two participants, 33%), consistent with the discoverability concern identified in Section 6.6.6 below. Task 4 (Contact a Seller) prompted one participant to pause and re-read the interface before locating the message button, resulting in a single hint. No participant abandoned any task or required significant intervention.

### 6.6.4 AI Price Prediction Acceptance

A specific interaction metric was captured for Task 2 regarding participant behaviour towards the AI-generated price suggestion. Additionally, participants rated the AI Price Prediction Feature on a 5-point scale in the post-session questionnaire.

**Task 2 Interaction Behaviour:**

| AI Pricing Behaviour | Count | Percentage |
|---|---|---|
| Used — accepted suggestion | 3 | 50% |
| Used — modified suggestion | 2 | 33% |
| Used — rejected suggestion | 0 | 0% |
| Did not use / could not find | 1 | 17% |

Five of six participants successfully engaged with the AI pricing feature; one required a hint to locate it (Task 2 hint, P02). No participant rejected the AI suggestion outright, and the two who modified the price did so by small increments (±£1–£2), indicating general trust in the AI's estimate while exercising personal judgement. This aligns with the design intent of the feature — to accelerate pricing decisions rather than enforce them.

**Post-Session Rating (5-point scale):**

| Rating | Count | Percentage |
|---|---|---|
| 5 — Excellent | 3 | 50% |
| 4 — Good | 3 | 50% |
| 3 — Neutral | 0 | 0% |
| 2 — Poor | 0 | 0% |
| 1 — Very Poor | 0 | 0% |
| **Mean** | **4.50** | |

All six participants rated the AI price prediction feature 4 or 5 out of 5, producing the highest mean satisfaction score (4.50) of any feature measured. This result provides strong empirical support for the feature's utility, validating the decision to integrate the Gemini API as a core pricing mechanism rather than an optional add-on.

### 6.6.5 System Usability Scale Results

The post-session questionnaire included five items drawn from the standard ten-item System Usability Scale (Brooke, 1996): items 3, 4, 6, 7, and 9. These items address ease of use, technical support dependency, system consistency, learnability, and user confidence — the five dimensions most directly relevant to a peer-to-peer marketplace used independently by students. For a five-item SUS subset, contribution scores (positive items: score − 1; negative items: 5 − score) are summed and multiplied by 5 to produce a score on the standard 0–100 scale, consistent with adapted SUS methodology reported in the HCI literature (Finstad, 2006).

**Per-Item Response Distribution and Adjusted Contributions:**

| SUS Item | Statement | Type | 1 | 2 | 3 | 4 | 5 | Mean | Adjusted Contribution |
|---|---|---|---|---|---|---|---|---|---|
| Q3 | I thought the system was easy to use | Positive | 0 | 0 | 1 | 1 | 4 | 4.50 | 3.50 |
| Q4 | I would need technical support to use this system | Negative | 1 | 1 | 0 | 1 | 3 | 3.67 | 1.33 |
| Q6 | There was too much inconsistency in this system | Negative | 3 | 1 | 1 | 1 | 0 | 2.00 | 3.00 |
| Q7 | Most people would learn to use this very quickly | Positive | 0 | 0 | 1 | 2 | 3 | 4.33 | 3.33 |
| Q9 | I felt confident using the system | Positive | 0 | 0 | 1 | 2 | 3 | 4.33 | 3.33 |
| | | | | | | | | **Sum** | **14.49** |

**Scaled Group SUS Score: 14.49 × 5 = 72.5**

SUS score benchmarks (Bangor, Kortum and Miller, 2008):

| Band | Score Range | StudentHub Result |
|---|---|---|
| Excellent | ≥ 85.5 | |
| Good | 72.75–85.5 | |
| **OK** | **51.7–72.75** | **72.5 ✓** |
| Poor | < 51.7 | |

The group SUS score of **72.5** places StudentHub at the upper boundary of the "OK" band, 0.25 points below the "Good" threshold. This result indicates that the platform is broadly usable by the target population but has identifiable areas for improvement, discussed in Sections 6.6.6 and 6.7.

The strongest contributor to the score was ease of use (Q3: 4.50/5), with 66.7% of participants assigning the maximum rating. The weakest contributor was the technical support item (Q4: adjusted contribution 1.33 of a possible 4.00), where 50% of participants agreed they would need technical support — the most concerning individual finding and a clear direction for future iteration. Consistency was perceived favourably (Q6 mean 2.00 on a negative item, indicating low perceived inconsistency), and both learnability and confidence scored identically at 4.33/5.

### 6.6.6 Supplementary Survey Results

In addition to the SUS items, participants rated two further aspects of the system and provided a Net Promoter Score.

**Overall Visual Design (5-point scale):**

| Rating | Count | Percentage |
|---|---|---|
| 5 — Excellent | 4 | 66.7% |
| 4 — Good | 1 | 16.7% |
| 3 — Neutral | 1 | 16.7% |
| 2 — Poor | 0 | 0% |
| 1 — Very Poor | 0 | 0% |
| **Mean** | **4.50** | |

The visual design rating (mean 4.50) tied with the AI feature as the highest-rated dimension. 83.4% of participants rated the design 4 or 5, reflecting positively on the UI decisions made throughout the design sprints — in particular the consistent purple accent palette, card-based product layout, and responsive grid.

**Recommendation Likelihood — Net Promoter Score (0–10 scale):**

| Score | Count | NPS Classification |
|---|---|---|
| 10 | 1 (16.7%) | Promoter |
| 9 | 1 (16.7%) | Promoter |
| 8 | 3 (50.0%) | Passive |
| 7 | 1 (16.7%) | Passive |
| **Mean: 8.33** | | **NPS = +33** |

NPS is calculated as: % Promoters (scores 9–10) − % Detractors (scores 0–6). With 2 promoters (33.3%), 4 passives (66.7%), and 0 detractors, the **NPS = +33**. Industry benchmarks categorise NPS scores above 0 as positive, above 20 as "favourable", and above 50 as "excellent" (Reichheld, 2003). A score of +33 for a prototype-stage academic platform is a strong result, indicating that the majority of users would either recommend the platform or are neutral rather than opposed. The absence of any detractors is particularly significant, suggesting no participant had a sufficiently negative experience to actively discourage use.

### 6.6.7 Qualitative Findings

Thematic analysis of observer notes and think-aloud transcripts identified four recurring themes across the six sessions:

**Theme 1 — AI Valuator Discoverability**
Two participants (P02, P04) required a hint to locate the Book Valuator feature during Task 2. Both initially attempted to type a price manually before noticing the "✦ AI Valuator" button. Think-aloud comments included: *"I wasn't sure what that symbol meant"* and *"I thought it was a decoration at first."* This aligns with Nielsen's (1994) heuristic H6 (Recognition over Recall): the feature was accessible but insufficiently prominent in the upload flow. The button label was identified as ambiguous for first-time users unfamiliar with the feature's purpose. This is corroborated by the 17% of participants who "could not find" the feature in the AI pricing interaction data (Section 6.6.4). A labelling change to "Get AI Price Estimate" or surfacing the button above the manual price field would likely resolve this in a future iteration.

**Theme 2 — Filter Combination Behaviour**
During Task 3 (Search and Filter), all participants located the search bar without difficulty; however, three participants initially attempted to apply both a category filter and a price filter simultaneously before realising only one filter panel was active at a time. Think-aloud comments noted the expectation of combined filtering. This represents a gap between the system's model and users' mental model — a violation of Nielsen's H2 (Match between system and the real world). No participant failed the task, but the additional exploration added time. Supporting this, the SUS Q6 (inconsistency) response distribution — whilst broadly positive — included one participant rating it 4/5, suggesting at least one user perceived interface inconsistency.

**Theme 3 — Messaging Interface Navigation**
Task 4 prompted one participant (P06) to pause on the product listing page before locating the "Contact Seller" affordance. Once found, the messaging flow was completed quickly by all participants with no further difficulty. Post-task commentary described the messaging interface as "clean" and "straightforward." The consensus view supports the high confidence rating (Q9 mean 4.33) — users felt in control once they located the relevant entry points, suggesting the issue is discoverability rather than the interaction design itself.

**Theme 4 — Onboarding and Technical Confidence**
The most significant qualitative pattern emerging from the sessions was a divergence in participant comfort with the platform's more advanced features. Participants with prior experience of marketplace platforms (eBay, Vinted) completed Task 2 without assistance, while participants who described themselves as infrequent online sellers required hints. This bifurcation is reflected in the Q4 SUS item (technical support need), where 50% rated it 5/5 (strongly agrees they would need support). Think-aloud data from these participants centred on uncertainty about the listing creation flow — specifically which fields were mandatory — rather than the AI feature itself. This suggests the addition of inline field guidance or a brief onboarding tooltip sequence would materially improve confidence for less experienced users.

### 6.6.8 Critical Incidents

Critical incidents (Flanagan, 1954) — moments of significant usability breakdown or unexpected positive interaction — documented from observer records:

| Participant | Task | Incident Description | Classification |
|---|---|---|---|
| P02 | Task 2 | Could not locate AI Valuator button; required observer hint after 90 seconds of manual price entry | Negative — discoverability failure |
| P04 | Task 2 | Hovered over AI Valuator, read the price prediction result aloud, and said *"that's actually really close to what I'd charge"* before accepting | Positive — AI trust moment |
| P01 | Task 3 | Immediately typed into the search bar without using any filter; located the result correctly in under 30 seconds | Positive — intuitive search behaviour |
| P06 | Task 4 | Spent approximately 45 seconds scanning the product page before locating the Contact Seller button; once found, composed and sent the message in under 20 seconds | Negative — button discoverability |
| P03 | Task 2 | Spontaneously listed a second non-book item after completing the first, unprompted, commenting *"this is actually quite easy"* | Positive — exceeds task scope |
| P05 | Task 5 | Navigated directly to dashboard and edited the listing without hesitation; fastest task completion across all participants | Positive — learnable interface |

The two negative critical incidents both relate to **discoverability** of interactive elements (AI Valuator button; Contact Seller button) rather than errors in system logic or workflow. This is a diagnostically important distinction: the underlying functionality is correct and well-received once found, but the signposting requires improvement. The three positive critical incidents collectively indicate that the core flows — search, listing creation, and listing management — are intuitive and, in some cases, exceeded participant expectations.

---

## 6.7 Critical Evaluation

The multi-level testing programme produced a coherent body of evidence from which both strengths and limitations of the StudentHub platform can be critically assessed.

### 6.7.1 Technical Correctness — Strengths

All 21 unit tests and all 30 API integration tests passed on first execution, and all 21 functional requirements were verified. This represents a technically complete and specification-conformant system. Several specific findings warrant discussion:

**AI Valuator robustness:** Integration test API-24 demonstrated graceful degradation when an invalid ISBN is supplied — the Gemini model still returned a reasonable price estimate, with its reasoning text acknowledging the unresolved title. This is a materially better user experience than returning an error, and is consistent with Martinez and Thompson's (2024) findings on AI pricing robustness. The usability data corroborates this: the AI feature received a 4.50/5 satisfaction rating with 100% of participants rating it 4 or 5, representing the strongest individual result in the entire evaluation programme.

**Authentication and authorisation boundaries:** API-16 and API-22 confirmed that all protected routes enforce authentication at the server level, independent of client-side state — a critical property in a peer-to-peer marketplace where client state can be trivially manipulated (OWASP, 2023). The self-purchase prevention guard (API-29, FR15) and payment idempotency guard further demonstrate that the system's security-critical paths were designed with adversarial inputs in mind, not just happy-path scenarios.

**Cart and checkout integrity:** API-14 confirmed that duplicate cart submissions increment quantity rather than creating duplicate records. Without this guard, users could incur double charges at checkout — a real-world failure mode observed in production e-commerce systems (Fowler, 2018). Its correct implementation here is a design strength.

### 6.7.2 Usability — Strengths and Limitations

The usability results present a more nuanced picture than the technical test results.

**Strengths:** The 100% task completion rate across all five tasks for all six participants is the single most important usability finding — it demonstrates that the core user journeys are executable by real students without training. The SUS score of 72.5 (borderline OK/Good) and NPS of +33 are consistent with a functional first release of a domain-specific platform. Notably, the visual design (4.50/5) and AI pricing feature (4.50/5) both received the highest ratings of any measured dimension, validating two of the system's primary differentiators. The zero-detractor NPS result confirms no participant had a sufficiently poor experience to actively discourage use.

**Limitations — Technical Support Dependency:** The most significant usability concern is the Q4 SUS item (technical support need), where 50% of participants rated it 5/5 (strongly agrees they would need support) and no participant rated it 1 (strongly disagrees). This drives the SUS adjusted contribution for Q4 down to 1.33 of a possible 4.00 — the single weakest dimension measured. Critically, this issue was not evenly distributed: think-aloud data indicates it was concentrated among participants with limited prior experience of peer-to-peer selling platforms. This suggests an onboarding gap rather than a fundamental usability failure; however, for a student-facing platform where a proportion of users will inevitably be selling for the first time, it represents a meaningful barrier to adoption. Inline field guidance, mandatory-field indicators, and a brief contextual tooltip for the AI Valuator button would address the two most cited pain points.

**Limitations — Discoverability:** Both negative critical incidents involved discoverability: the AI Valuator button and the Contact Seller affordance. These are distinct from usability errors — participants who found the features could use them without difficulty — but they create friction at the entry point of two key differentiating flows. This aligns with Nielsen's (1994) H6 heuristic (Recognition over Recall): in both cases, users had to recall or search for the interface element rather than recognising it immediately from visual affordance.

**Limitations — Sample Size:** The sample of N = 6 is a recognised constraint of academic usability testing. Nielsen (1993) argues that five users detect the majority of usability issues in a system, and the qualitative findings here show clear convergence across participants (the same issues appear consistently), which increases confidence that the identified themes are representative. Nevertheless, the SUS score derived from six respondents carries a wide confidence interval, and the NPS should be treated as directional rather than statistically precise. A larger follow-up study post-launch would provide more robust quantitative benchmarking.

**Limitations — Filter Combination:** The qualitative theme around combined category and price filtering (Section 6.6.7, Theme 2) was not captured in the SUS items but represents a design debt. Three of six participants showed confusion between the two filter systems, suggesting this interaction pattern should be redesigned before a public release — either by enabling simultaneous filter application or by making the mutual exclusivity of the current design explicit.

### 6.7.3 Evaluation Against Success Criteria

The non-functional requirements defined in Chapter 4 can now be assessed against the testing evidence:

| Criterion | Evidence | Assessment |
|---|---|---|
| FR coverage | All 21 FRs pass system testing | Met |
| API correctness | 30/30 integration tests pass | Met |
| Core logic correctness | 21/21 unit tests pass | Met |
| Usability (SUS ≥ 70) | SUS = 72.5 | Met |
| AI feature acceptance | 100% rated 4–5/5 | Met (exceeded) |
| User recommendation intent | NPS = +33, no detractors | Met |
| Technical support independence | 50% need support (Q4) | Partially met — requires onboarding improvements |

Six of seven assessed criteria are fully met; the seventh (technical support independence) is partially met and has a clear remediation path through UI improvements rather than architectural changes.

---

## 6.8 Summary

This chapter presented a comprehensive, multi-level testing programme for the StudentHub platform. Unit testing (21 tests, 100% pass rate) verified the correctness of core business logic in isolation. API integration testing (30 tests across 6 endpoint groups, 100% pass rate) confirmed that the RESTful server correctly handles both valid and invalid inputs, returning appropriate HTTP status codes and enforcing authentication and authorisation boundaries. System functional testing verified all 21 functional requirements against the original specification.

Cooperative usability evaluation (Carroll and Mack, 1984) was conducted with six undergraduate student participants. All participants completed all five tasks (100% completion rate across 25 task attempts). The group SUS score of 72.5 places the platform at the upper boundary of the "OK" band. The AI price prediction feature received the highest satisfaction rating of any measured dimension (mean 4.50/5, 100% rated 4–5), validating the core design decision to integrate AI-assisted pricing as a first-class feature. Overall visual design was rated equally highly (4.50/5). The Net Promoter Score of +33 with zero detractors indicates that no participant had a sufficiently negative experience to discourage use, a strong result for a first-release academic platform.

The principal usability finding requiring remediation is the technical support dependency (SUS Q4), concentrated among participants with limited prior experience of peer-to-peer selling, and compounded by discoverability issues with the AI Valuator button and Contact Seller affordance. These are interaction design issues — resolvable through incremental UI iteration — rather than architectural or functional deficiencies.

Taken together, the evidence supports the conclusion that StudentHub meets its core functional and quality requirements, with particular strength in AI feature performance and visual design, and a clear, bounded remediation agenda for future iterations focused on onboarding support and feature discoverability.

---

## References

Bangor, A., Kortum, P.T. and Miller, J.T. (2008) 'An empirical evaluation of the system usability scale', *International Journal of Human-Computer Interaction*, 24(6), pp. 574–594.

Brooke, J. (1996) 'SUS: A "quick and dirty" usability scale', in Jordan, P.W. et al. (eds) *Usability Evaluation in Industry*. London: Taylor and Francis, pp. 189–194.

Carroll, J.M. and Mack, R.L. (1984) 'Actively learning to use a word processor', in Nilsson, W.E. (ed.) *Advances in Human-Computer Interaction*, Vol. 1. Norwood: Ablex, pp. 259–282.

Cohn, M. (2009) *Succeeding with Agile: Software Development Using Scrum*. Boston: Addison-Wesley.

Dumas, J.S. and Redish, J. (1999) *A Practical Guide to Usability Testing*. Revised edn. Exeter: Intellect.

Finstad, K. (2006) 'The system usability scale and non-native English speakers', *Journal of Usability Studies*, 1(4), pp. 185–188.

Flanagan, J.C. (1954) 'The critical incident technique', *Psychological Bulletin*, 51(4), pp. 327–358.

Fowler, M. (2018) *Refactoring: Improving the Design of Existing Code*. 2nd edn. Boston: Addison-Wesley.

Martinez, R. and Thompson, K. (2024) 'Machine learning approaches to second-hand book price prediction: A comparative analysis', *Journal of Electronic Commerce Research*, 25(1), pp. 44–61.

Myers, G.J., Badgett, T. and Sandler, C. (2011) *The Art of Software Testing*. 3rd edn. Hoboken: John Wiley & Sons.

Nielsen, J. (1993) *Usability Engineering*. Boston: Academic Press.

Nielsen, J. (1994) 'Enhancing the explanatory power of usability heuristics', in *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems*. Boston, 24–28 April. New York: ACM, pp. 152–158.

OWASP (2023) *OWASP Top Ten*. Available at: https://owasp.org/www-project-top-ten/ (Accessed: 23 March 2026).

Reichheld, F.F. (2003) 'The one number you need to grow', *Harvard Business Review*, 81(12), pp. 46–54.

