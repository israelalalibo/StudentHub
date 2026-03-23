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

**Participants:** [N = DATA PENDING] undergraduate students from the University of Salford, recruited via convenience sampling. Participants represented the target user population; none were involved in the development of the system.

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

*[Insert completed table once data collection is complete]*

| Participant | Task 1 | Task 2 | Task 3 | Task 4 | Task 5 |
|---|---|---|---|---|---|
| P01 | [DATA PENDING] | | | | |
| P02 | | | | | |
| P03 | | | | | |
| P04 | | | | | |
| P05 | | | | | |
| P06 | | | | | |
| P07 | | | | | |
| P08 | | | | | |
| ... | | | | | |
| **Mean Duration (sec)** | | | | | |
| **Completion Rate** | | | | | |
| **Mean Errors** | | | | | |

Completion codes: C = Completed without help; CH = Completed with hint; CS = Completed with significant help; F = Failed/Abandoned.

### 6.6.4 AI Price Prediction Acceptance

A specific interaction metric was captured for Task 2 regarding participant behaviour towards the AI-generated price suggestion:

| AI Pricing Behaviour | Count | Percentage |
|---|---|---|
| Used — accepted suggestion | [DATA PENDING] | |
| Used — modified suggestion | | |
| Used — rejected suggestion | | |
| Did not use / could not find | | |

*[Data to be inserted upon completion of usability sessions]*

### 6.6.5 System Usability Scale Results

SUS scores were computed per participant using Brooke's (1996) formula: each odd item score is reduced by 1; each even item score is subtracted from 5; the sum of adjusted scores is multiplied by 2.5.

| Participant | SUS Score | Adjective Rating |
|---|---|---|
| P01 | [DATA PENDING] | |
| P02 | | |
| ... | | |
| **Mean** | | |
| **Std Deviation** | | |

SUS score benchmarks (Bangor, Kortum and Miller, 2008):
- ≥ 85.5 = Excellent
- 72.75–85.5 = Good
- 51.7–72.75 = OK
- < 51.7 = Poor

*[Insert mean SUS score and adjective rating once data is collected]*

### 6.6.6 Qualitative Findings

*[Themes to be completed from think-aloud transcripts and observer notes — draft themes listed below based on pre-testing observations and expert walkthrough]*

Preliminary thematic analysis of observer notes and think-aloud transcripts identified the following recurring themes:

**Theme 1 — AI Valuator Discoverability**
Several participants during the pilot walkthrough required additional time to locate the Book Valuator feature during the listing creation process. This aligns with Nielsen's (1994) heuristic H6 (Recognition over Recall): the feature was accessible but not immediately prominent in the upload flow. The AI Valuator button label "✦ AI Valuator" was noted as potentially ambiguous for first-time users unfamiliar with the feature's purpose.

**Theme 2 — Filter Combination Behaviour**
[DATA PENDING — to be completed from participant observations]

**Theme 3 — Messaging Interface Navigation**
[DATA PENDING — to be completed from participant observations]

**Theme 4 — Registration Flow**
[DATA PENDING — to be completed from participant observations]

### 6.6.7 Critical Incidents

*[To be completed from Observer Recording Sheets — critical incidents section]*

Critical incidents (Flanagan, 1954) — moments of significant usability breakdown or unexpected positive interaction — are documented below:

| Participant | Task | Incident Description | Classification |
|---|---|---|---|
| [DATA PENDING] | | | Positive / Negative |

---

## 6.7 Follow-Up Analysis and Reflection

The testing programme revealed several significant findings that informed subsequent refinements to the system.

**AI Valuator accuracy:** Integration test API-24 demonstrated that the Gemini-powered book valuator returns reasonable price estimates even when the ISBN cannot be resolved via the Google Books API. This graceful degradation is a strength of the AI-first architecture — the model's contextual understanding compensates for incomplete metadata, a behaviour consistent with Martinez and Thompson's (2024) findings on AI pricing robustness.

**Authentication boundary testing:** API-16 and API-22 confirmed that all protected routes correctly enforce authentication at the server level, independent of client-side session state. This is a critical security property for a peer-to-peer marketplace, as client-side state can be trivially manipulated by malicious actors (OWASP, 2023).

**Cart idempotency:** API-14 verified that submitting the same product twice to the cart increments quantity rather than creating duplicate records. Without this guard, users could accumulate duplicate charges at checkout — a data integrity concern confirmed as correctly handled by the system.

**Functional requirement coverage:** All twenty-one functional requirements passed system testing. This provides quantitative evidence that the implemented system conforms to the specification developed in Chapter 4, supporting the success criteria defined at project inception.

**Usability testing:** [DATA PENDING — to be added once participant sessions are complete. Discuss SUS score in context of benchmark, task completion rates, and key qualitative findings from think-aloud.]

---

## 6.8 Summary

This chapter presented a comprehensive, multi-level testing programme for the StudentHub platform. Unit testing (21 tests, 100% pass rate) verified the correctness of core business logic in isolation. API integration testing (30 tests across 6 endpoint groups, 100% pass rate) confirmed that the RESTful server correctly handles both valid and invalid inputs, returning appropriate HTTP status codes and enforcing authentication boundaries. System functional testing verified all 21 functional requirements against the original specification. Cooperative usability evaluation with undergraduate student participants [DATA PENDING — add N and key results] provided both quantitative task performance data and qualitative insight into the platform's real-world usability.

The results collectively support the conclusion that StudentHub meets its core functional and quality requirements, with the AI price prediction feature operating reliably across both valid and invalid input conditions. [DATA PENDING — add usability conclusions once sessions are complete.]

---

## References

Bangor, A., Kortum, P.T. and Miller, J.T. (2008) 'An empirical evaluation of the system usability scale', *International Journal of Human-Computer Interaction*, 24(6), pp. 574–594.

Brooke, J. (1996) 'SUS: A "quick and dirty" usability scale', in Jordan, P.W. et al. (eds) *Usability Evaluation in Industry*. London: Taylor and Francis, pp. 189–194.

Carroll, J.M. and Mack, R.L. (1984) 'Actively learning to use a word processor', in Nilsson, W.E. (ed.) *Advances in Human-Computer Interaction*, Vol. 1. Norwood: Ablex, pp. 259–282.

Cohn, M. (2009) *Succeeding with Agile: Software Development Using Scrum*. Boston: Addison-Wesley.

Dumas, J.S. and Redish, J. (1999) *A Practical Guide to Usability Testing*. Revised edn. Exeter: Intellect.

Flanagan, J.C. (1954) 'The critical incident technique', *Psychological Bulletin*, 51(4), pp. 327–358.

Fowler, M. (2018) *Refactoring: Improving the Design of Existing Code*. 2nd edn. Boston: Addison-Wesley.

Martinez, R. and Thompson, K. (2024) 'Machine learning approaches to second-hand book price prediction: A comparative analysis', *Journal of Electronic Commerce Research*, 25(1), pp. 44–61.

Myers, G.J., Badgett, T. and Sandler, C. (2011) *The Art of Software Testing*. 3rd edn. Hoboken: John Wiley & Sons.

Nielsen, J. (1993) *Usability Engineering*. Boston: Academic Press.

Nielsen, J. (1994) 'Enhancing the explanatory power of usability heuristics', in *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems*. Boston, 24–28 April. New York: ACM, pp. 152–158.

OWASP (2023) *OWASP Top Ten*. Available at: https://owasp.org/www-project-top-ten/ (Accessed: 23 March 2026).
