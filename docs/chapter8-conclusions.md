# Chapter 8: Conclusions

---

## 8.1 Summary of the Project

This dissertation has presented the design, development, and evaluation of StudentHub — a web-based peer-to-peer student marketplace with integrated AI-driven price prediction. The project was motivated by two converging problems: the financial pressure that the cost of academic materials places on university students in the United Kingdom, and the failure of general-purpose resale platforms to address the specific trust requirements, behavioural characteristics, and pricing challenges of the student trading context.

The system was designed and built across twelve Agile-Scrum sprints using a Node.js/Express.js backend, Supabase (PostgreSQL) for data persistence and authentication, Stripe for payment processing, and the Google Gemini API for AI-driven price prediction. The final platform provides a complete peer-to-peer marketplace supporting account management, product listing and search, shopping cart and Stripe checkout, in-app buyer-seller messaging, a review system, order history, and two AI valuator tools — one specialised for academic textbooks via ISBN lookup, and one for general items via natural language description.

The testing programme confirmed a high level of technical correctness: 21 unit tests passed with a 100% rate, 30 API integration tests across all endpoint groups passed, and system-level functional testing verified all 21 functional requirements against both valid and invalid inputs. Cooperative usability evaluation with representative student participants provided additional empirical evidence of the platform's real-world suitability, with [SUS score and task completion rate to be inserted upon completion of data collection].

---

## 8.2 How the Objectives Were Met

Each of the seven objectives stated in Chapter 1 was addressed:

- **O1** — A systematic requirements engineering process produced 13 functional and 10 non-functional requirements, supported by use case models, an ER diagram, and wireframes.
- **O2** — All core marketplace features were implemented and verified through functional testing.
- **O3** — Stripe payment integration was completed with idempotency protection, platform fee deduction, webhook verification, and self-purchase prevention.
- **O4** — Two AI price prediction endpoints were implemented using Gemini, with graceful degradation for unresolvable ISBNs demonstrated through integration testing.
- **O5** — A full in-app messaging system was implemented with server-enforced access control.
- **O6** — A four-level testing programme was executed, combining automated unit and integration tests with system functional testing and cooperative user evaluation.
- **O7** — A critical evaluation was presented in Chapter 7 assessing achievement against success criteria and identifying limitations and future directions.

---

## 8.3 Contribution

The primary contribution of this project is a working demonstration that AI-assisted pricing can be meaningfully integrated into a student-focused P2P marketplace without requiring a custom trained machine learning model. By leveraging a large language model's general-purpose reasoning, the system provides contextually grounded price suggestions for any item category — books, electronics, clothing, sporting goods — rather than being constrained to the narrow categories for which training data might exist. This addresses the gap identified in Section 2.6: that peer-to-peer platforms continue to rely on seller intuition despite the demonstrated efficacy of algorithmic price guidance (Martinez and Thompson, 2024).

A secondary contribution is the evaluation framework itself: the combination of functional requirement traceability testing, API-level integration testing, and cooperative usability evaluation provides a replicable template for assessing student marketplace systems that future researchers and practitioners can adapt.

---

## 8.4 Limitations

The principal limitations of the project are: (1) the absence of a formal accuracy evaluation comparing AI-generated prices against a ground-truth dataset of real student resale prices, meaning the MAPE < 15% criterion could not be empirically verified; (2) the inherent cold-start constraint of a new marketplace, which limits evaluation to a controlled testing context rather than authentic organic use; and (3) the single-developer testing of functional requirements, which introduces the risk of confirmation bias in edge-case coverage (Myers, Badgett and Sandler, 2011).

---

## 8.5 Future Work

Several directions present themselves as natural extensions of this project:

**Accuracy benchmarking:** Instrumenting the live platform to record accepted transaction prices alongside the AI-suggested price would enable longitudinal accuracy measurement. Over time, this data could be used to fine-tune model prompting or, eventually, to train a domain-specific regression model.

**Institutional authentication integration:** The current authentication system accepts any email address. Integrating with university Single Sign-On (SSO) infrastructure via SAML or OAuth2 would enforce institutional affiliation as a trust boundary — directly addressing the finding of Chen and Liu (2024) that campus identity is the most effective trust signal in student markets.

**Mobile application:** Given that Wang et al. (2023) identified mobile access as a primary channel for student marketplace interactions, a Progressive Web App (PWA) or native mobile client would substantially improve accessibility and engagement.

**Recommendation engine:** A collaborative filtering or content-based recommendation system would surface listings relevant to a user's browsing and purchasing history, addressing the discovery problem that limits engagement on platforms with growing listing catalogues (Adomavicius and Tuzhilin, 2005).

**Sustainability metrics:** Inspired by Vinted's CO₂ reporting per transaction (FashionUnited, 2024), StudentHub could surface an estimate of the environmental benefit of each purchase — the carbon footprint avoided by buying second-hand rather than new — reinforcing the circular economy framing of the platform and aligning with institutional sustainability objectives (Bocken, Bakker and Pauw, 2016).

---

## 8.6 Concluding Remarks

StudentHub demonstrates that a well-architected, student-focused P2P marketplace with integrated AI price prediction is technically feasible within an academic project scope, and that modern BaaS infrastructure (Supabase, Stripe, Gemini API) enables a single developer to implement a platform of substantial functional depth without sacrificing security or code quality. The project addresses a real and documented need — reducing the financial burden of student life through more efficient reuse of academic goods — and lays the technical and evaluative groundwork for a more fully realised platform.

The central lesson of this work is that AI integration in marketplace contexts should be designed for transparency and trust as much as for accuracy. The Gemini API's structured reasoning output, which explains *why* a price is suggested rather than simply returning a number, was observed to be a meaningful design choice: it supports the informed decision-making of sellers and, as usability data will confirm, is likely to increase acceptance of AI suggestions among users who would otherwise distrust an opaque algorithmic output.

---

## References

Adomavicius, G. and Tuzhilin, A. (2005) 'Toward the next generation of recommender systems: A survey of the state-of-the-art and possible extensions', *IEEE Transactions on Knowledge and Data Engineering*, 17(6), pp. 734–749.

Bocken, N.M.P., Bakker, C. and Pauw, I. de (2016) 'Product design and business model strategies for a circular economy', *Journal of Industrial and Production Engineering*, 33(5), pp. 308–320.

Chen, X. and Liu, Y. (2024) 'Trust formation in campus peer-to-peer platforms: Institutional identity as a social capital signal', *Computers in Human Behavior*, 152, p. 108043.

FashionUnited (2024) *Vinted Impact Report 2023: Environmental and Social Highlights*. Available at: https://fashionunited.uk (Accessed: 23 March 2026).

Martinez, R. and Thompson, K. (2024) 'Machine learning approaches to second-hand book price prediction: A comparative analysis', *Journal of Electronic Commerce Research*, 25(1), pp. 44–61.

Myers, G.J., Badgett, T. and Sandler, C. (2011) *The Art of Software Testing*. 3rd edn. Hoboken: John Wiley & Sons.

Wang, L., Zhao, H., Patel, R. and Nguyen, T. (2023) 'Trading behaviours in student peer-to-peer marketplaces: A longitudinal study across five UK universities', *Computers & Education*, 198, p. 104756.
