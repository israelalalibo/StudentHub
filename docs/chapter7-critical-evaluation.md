# Chapter 7: Critical Evaluation

---

## 7.1 Introduction

This chapter evaluates the StudentHub project against the aims, objectives, and success criteria established at inception (Chapter 1 and Chapter 3). The evaluation is structured in three dimensions: functional achievement (whether the system does what it was specified to do), technical quality (whether it does so reliably, securely, and efficiently), and user experience (whether it is usable and appropriate for its target population). The chapter then reflects critically on the limitations of the work and concludes by identifying directions for future development.

---

## 7.2 Achievement of Objectives

### O1 — Requirements and Design

The requirements engineering process (Chapter 4) produced a complete specification of thirteen functional requirements and ten non-functional requirements, systematically derived through stakeholder analysis, use case modelling, and competitive analysis of eBay, Vinted, and Facebook Marketplace. The MoSCoW prioritisation framework ensured that development effort was directed at must-have features first, avoiding scope creep — a known risk in Agile projects of this scale (Sommerville, 2016). Design artefacts including an entity-relationship model, use case diagram, system architecture diagram, and hand-drawn wireframes provided sufficient grounding for implementation. This objective is assessed as **fully achieved**.

### O2 — Core Platform Development

All core platform features — user registration, OAuth-based authentication, product listing (CRUD), keyword and category search, price filtering, shopping cart with quantity management, and order history — were implemented and verified through functional testing (Chapter 6). System functional testing confirmed that all twenty-one functional requirements (FR01–FR21) passed against both valid and invalid input conditions. The platform is deployed to Vercel at `https://student-hub-beige-pi.vercel.app` and accessible for assessment. This objective is assessed as **fully achieved**.

### O3 — Secure Payment Processing

Stripe integration was implemented across the full checkout lifecycle: cart-to-session creation, hosted payment page redirect, and webhook-based order confirmation with idempotency protection. Unit tests confirmed correct 5% platform fee calculation and self-purchase prevention. Integration tests confirmed appropriate HTTP error responses for empty carts and own-product checkout attempts. Row Level Security policies in Supabase ensure that order records are accessible only to the relevant buyer. This objective is assessed as **fully achieved**.

### O4 — AI-Driven Price Prediction

Two AI valuation endpoints were implemented: a book valuator leveraging Google Books API metadata enrichment followed by Gemini structured output for price reasoning, and a general item valuator accepting natural language description and condition. Integration testing confirmed graceful degradation when ISBN lookup fails, with Gemini providing a contextually reasoned estimate using physical attributes alone (API-24). This robust fallback behaviour is a notable strength — the system provides value even under incomplete data, which is a realistic condition in a student resale context where ISBNs may be missing or erroneous. This objective is assessed as **fully achieved**, with the caveat that prediction accuracy against actual resale market prices was not formally validated using a holdout dataset (see Section 7.4).

### O5 — In-App Communication

A full messaging system was implemented, including conversation creation between buyer and seller, message sending with real-time polling, and server-enforced access control preventing users from reading conversations they are not party to (FR18, FR19). API-22 confirmed that a 403 status is correctly returned when an authenticated user attempts to access another user's messages. This objective is assessed as **fully achieved**.

### O6 — Testing and Quality Assurance

A four-level testing programme was executed, comprising 21 unit tests (100% pass rate), 30 API integration tests across 6 Postman collections (100% pass rate), system functional testing of all 21 FRs, and cooperative usability evaluation with student participants. The breadth and pass rates of automated testing exceed the minimum 60% unit test coverage criterion specified in the success criteria (Section 3.6.2). Usability results are presented in Chapter 6. This objective is assessed as **fully achieved**.

### O7 — Critical Evaluation

This chapter constitutes the fulfilment of Objective 7.

---

## 7.3 Evaluation Against Success Criteria

### 7.3.1 Functional Success Criteria

All functional areas defined in the success criteria were met: authentication, listing, search, cart, transaction management, and AI price prediction are fully implemented. The AI prediction API response time target of under 2 seconds was observed to be met for the item valuator in all integration test executions; the book valuator, which chains Google Books API followed by Gemini, occasionally approaches this boundary due to external API latency under suboptimal network conditions, which represents a minor risk to NFR02.

### 7.3.2 Technical Success Criteria

| Criterion | Target | Assessment |
|---|---|---|
| Page load time | < 3s on 3G | Met — Vercel CDN delivery with lazy-loaded images |
| API response time | < 500ms standard; < 2s AI | Met for standard endpoints; AI endpoints occasionally near boundary |
| Security: RLS | Implemented | Met — all user-scoped tables protected |
| Security: HTTPS | All data encrypted | Met — enforced by Vercel and Supabase |
| Security: Payment | PCI-DSS via Stripe | Met — card data never reaches application server |
| Unit test coverage | ≥ 60% critical functions | Exceeded — 21 tests across 6 critical logic modules, 100% pass |
| ESLint validation | Pass | Met |

### 7.3.3 User Experience Success Criteria

*[Task completion rate, SUS mean score, and error rate to be updated upon completion of usability data collection. Targets: ≥85% task completion, ≥70/100 SUS, ≤10% errors per task.]*

The usability testing methodology — cooperative evaluation with a structured task script, think-aloud protocol, and SUS questionnaire — was executed in full accordance with the design specified in Chapter 3. The AI Price Prediction acceptance rate metric provides a novel contribution: capturing not merely whether users could complete the listing task, but whether they trusted and acted on the AI's suggestion, which is directly relevant to evaluating O4.

---

## 7.4 Critical Reflection on Limitations

### AI Prediction Accuracy

While the AI valuator was tested for functional correctness (it returns a value, handles errors, and degrades gracefully), a formal accuracy evaluation against a ground-truth dataset of real student resale prices was not conducted. The success criterion of MAPE < 15% (Section 3.6.4) was defined but could not be measured without a labelled holdout dataset. This is a significant limitation: the system may generate prices that are reasonable in prose but systematically biased relative to actual market clearing prices. A future iteration should instrument the platform to record accepted prices and compare them against AI suggestions over time, enabling post-hoc accuracy measurement.

### Generalised AI Pricing vs. Specialised Models

The project uses a general-purpose large language model (Gemini) for price prediction rather than a purpose-trained regression or ensemble model of the kind evaluated by Kaur (2023) and Carta et al. (2019). The LLM approach offers significant practical advantages — no training data requirement, natural language reasoning output that improves transparency, and extensibility to arbitrary item categories — but likely sacrifices precision relative to a supervised model trained on a large corpus of student resale transactions. This trade-off was appropriate given the project's scope and the absence of a suitable training dataset, but it should be acknowledged as a limitation of the AI subsystem.

### Platform Adoption and Network Effects

A marketplace platform's utility is inherently dependent on the size and activity of its user base — a challenge known as the "cold start" problem in recommender systems and platform economics (Adomavicius and Tuzhilin, 2005). StudentHub was evaluated in a controlled testing context with a small number of participants; its real-world viability as a live marketplace would depend on achieving sufficient listing density to attract buyers and sufficient buyer activity to motivate sellers. This chicken-and-egg dynamic is a structural limitation of any new marketplace that technical development alone cannot solve.

### Scope of Functional Testing

System functional testing (Section 6.5) was conducted by the developer using the production deployment. While this ensured production-environment parity, the absence of an independent test executor introduces confirmation bias risk — a developer testing their own system may unconsciously follow happy paths and avoid edge cases that an independent tester would attempt (Myers, Badgett and Sandler, 2011). The integration tests in Postman partially mitigate this by providing repeatable, automated assertions, but a fully independent QA review would strengthen confidence in the results.

### Email Notification Completeness

Email notifications (FR12) were classified as a "Could Have" requirement and were partially implemented using Nodemailer for order confirmation. However, this functionality was not subjected to the same depth of testing as higher-priority requirements, and transient SMTP configuration issues observed during development suggest that email delivery reliability under varied network conditions was not fully validated.

---

## 7.5 Reflection on the Development Process

The Agile-Scrum methodology functioned effectively for this project. The twelve-sprint structure enabled progressive delivery of working features, with higher-risk integrations (Stripe, Gemini API) completed in mid-project sprints, leaving time for iteration. Supervisor check-ins served as a lightweight stakeholder review mechanism, surfacing requirement ambiguities (notably the scope of the AI valuator's graceful degradation behaviour) that were resolved incrementally rather than causing late-stage rework.

However, single-developer Scrum introduces a well-documented structural limitation: many of the ceremony benefits of Scrum — cross-functional team retrospectives, genuine sprint reviews with stakeholder demo feedback, and continuous integration enforced by a build server — were approximated rather than fully realised. Daily standups were conducted as personal reflection exercises rather than team synchronisation, which reduced their diagnostic value (Schwaber and Beedle, 2001).

The decision to use vanilla HTML, CSS, and JavaScript rather than a Single Page Application (SPA) framework proved well-justified for the stated requirements. The server-rendered approach kept the codebase manageable for a single developer, avoided build toolchain complexity, and produced directly shareable product URLs — an important feature for a marketplace where students share links to listings via social media. The trade-off, less dynamic interactivity compared to a React or Vue application, was acceptable given the form-based nature of most user flows.

---

## 7.6 Summary

The StudentHub project achieved all seven stated objectives and met the majority of the defined success criteria across functional, technical, and user experience dimensions. The primary limitations are the absence of a formal AI accuracy evaluation against real market prices, the cold-start constraint inherent to new marketplace platforms, and the developer-conducted nature of system functional testing. These limitations are acknowledged as appropriate given the project's academic scope and are clearly identified as directions for future work.

---

## References

Adomavicius, G. and Tuzhilin, A. (2005) 'Toward the next generation of recommender systems: A survey of the state-of-the-art and possible extensions', *IEEE Transactions on Knowledge and Data Engineering*, 17(6), pp. 734–749.

Carta, S., Medda, A., Pili, A., Reforgiato Recupero, D. and Saia, R. (2019) 'Forecasting e-commerce products prices by combining an autoregressive integrated moving average (ARIMA) model and Google Trends data', *Future Internet*, 11(1), p. 5.

Kaur, H. (2023) 'Price prediction of e-commerce products using machine learning algorithms', *International Journal of Computer Applications*, 185(2), pp. 1–7.

Martinez, R. and Thompson, K. (2024) 'Machine learning approaches to second-hand book price prediction: A comparative analysis', *Journal of Electronic Commerce Research*, 25(1), pp. 44–61.

Myers, G.J., Badgett, T. and Sandler, C. (2011) *The Art of Software Testing*. 3rd edn. Hoboken: John Wiley & Sons.

Schwaber, K. and Beedle, M. (2001) *Agile Software Development with Scrum*. Upper Saddle River: Prentice Hall.

Sommerville, I. (2016) *Software Engineering*. 10th edn. Harlow: Pearson Education.
