# Chapter 1: Introduction

---

## 1.1 Motivation

The rising cost of living among university students in the United Kingdom has become a well-documented concern, with the National Union of Students (NUS, 2023) reporting that over 70% of students express financial anxiety directly linked to the costs of academic materials, accommodation, and daily expenses. Within this context, educational resources — particularly textbooks, electronics, and academic equipment — represent a significant and largely avoidable expenditure. These items are frequently purchased new at full market price, used for a single academic year, and subsequently discarded or left dormant. This pattern of waste is not only financially harmful to individual students but also contributes to the broader sustainability challenge that higher education institutions are increasingly being called upon to address (Bocken, Bakker and Pauw, 2016).

Peer-to-peer (P2P) online marketplaces present a viable mechanism for mitigating these pressures, enabling students to exchange goods directly within their campus communities. General-purpose platforms such as eBay and Facebook Marketplace provide the technical infrastructure for such exchanges; however, they are designed for a broad consumer audience and fail to address the specific behavioural characteristics and trust requirements of student traders. Wang et al. (2023) conducted a longitudinal study across five UK universities demonstrating that students exhibit significantly higher price sensitivity — approximately 3.2 times greater than the general population — and exhibit a strong preference for geographically proximate transactions. Furthermore, Chen and Liu (2024) found that institutional affiliation functions as a more powerful trust signal among student traders than traditional reputation metrics, suggesting that campus-focused platforms require fundamentally different trust architectures than those underpinning established consumer marketplaces.

A further critical limitation of existing platforms is their reliance on seller intuition for price-setting. Heller and Olsson (2023) demonstrated that user-estimated pricing on resale platforms introduces significant valuation discrepancies, leading to both overpricing (which deters buyers) and underpricing (which disadvantages sellers). Martinez and Thompson (2024) showed that machine learning-based price prediction models reduced price dispersion by 32% and improved transaction completion rates by 28% in second-hand goods markets. Despite these findings, no mainstream student-facing marketplace has integrated AI-driven price guidance into the listing creation workflow.

These converging factors — the financial burden on students, the limitations of general-purpose platforms, and the demonstrated efficacy of AI-assisted pricing — constitute the primary motivation for this project. StudentHub is conceived as a purpose-built, web-based student marketplace that addresses each of these gaps: providing a trusted, campus-contextualised trading environment with intelligent price prediction capabilities powered by large language model technology.

---

## 1.2 Aim

The aim of this project is to **design, develop, and evaluate a web-based peer-to-peer student marketplace incorporating AI-driven price prediction**, enabling university students to buy and sell academic goods and personal items in a secure, efficient, and user-centred environment.

---

## 1.3 Objectives

In order to fulfil the stated aim, the following objectives were identified and systematically addressed throughout the project:

**O1 — Requirements and Design:** To conduct a systematic requirements engineering process, producing a complete specification of functional and non-functional requirements, and to translate these requirements into a coherent system architecture using industry-standard design artefacts including use case diagrams, entity-relationship models, and wireframes.

**O2 — Core Platform Development:** To implement a fully functional peer-to-peer marketplace supporting user registration and authentication (including OAuth), product listing management (create, read, update, delete), keyword and category search, and a shopping cart with persistent session state.

**O3 — Secure Payment Processing:** To integrate a payment gateway (Stripe) enabling end-to-end checkout with platform fee deduction, webhook-based order confirmation, and prevention of self-purchase, in compliance with PCI-DSS requirements.

**O4 — AI-Driven Price Prediction:** To design and implement an AI-powered price prediction module utilising the Google Gemini large language model API, capable of generating evidence-based price recommendations for both academic textbooks (via ISBN lookup) and general items (via natural language description and condition assessment).

**O5 — In-App Communication:** To develop a real-time-capable messaging system enabling buyers and sellers to communicate directly within the platform, supporting enquiries prior to purchase in accordance with P2P marketplace trust requirements (Chen and Liu, 2024).

**O6 — Testing and Quality Assurance:** To execute a multi-level testing programme encompassing unit testing of core business logic, API integration testing of all server endpoints, system-level functional testing against the full requirements specification, and cooperative usability evaluation with representative student participants.

**O7 — Critical Evaluation:** To evaluate the implemented system against the defined success criteria, reflecting critically on design decisions, implementation challenges, limitations, and directions for future development.

---

## 1.4 Adopted Approach

The project adopted an **Agile-Scrum development methodology** (Beck et al., 2001), structured across twelve two-week sprints spanning the full academic year (September 2025 – April 2026). This iterative approach was selected in preference to a sequential waterfall model for several reasons. First, the exploratory nature of integrating AI price prediction into a marketplace context meant that requirements were likely to evolve as technical constraints and user insights emerged. Second, Agile's emphasis on working software at each sprint boundary provided a mechanism for progressive supervisor review and feedback. Third, sprint-based decomposition allowed risk to be managed incrementally, with higher-risk features (AI integration, payment processing) scheduled into dedicated sprints with contingency time (PMI, 2021).

The **technology stack** was selected to optimise development velocity while meeting the non-functional requirements for security, scalability, and maintainability. Node.js with Express.js was chosen as the backend framework for its asynchronous, event-driven model suited to I/O-intensive marketplace operations (Madurapperuma, Shafana and Sabani, 2022). Supabase — an open-source Backend-as-a-Service built on PostgreSQL — provided managed authentication, relational data storage with Row Level Security, and real-time capabilities without the infrastructure overhead of a self-hosted database (Orthian, 2024). Stripe was selected as the payment gateway for its PCI-DSS Level 1 certification, comprehensive test mode, and webhook architecture. The Google Gemini API was selected for AI price prediction over alternatives due to its multimodal reasoning capability, structured JSON output support, and generous free tier appropriate for an academic project.

The **evaluation strategy** combined objective quality measurement with user-centred assessment. Unit and integration tests provided quantitative evidence of functional correctness, while cooperative evaluation (Carroll and Mack, 1984) with student participants provided empirical insight into real-world usability. The System Usability Scale (Brooke, 1996) was employed as a validated, standardised instrument for quantifying perceived usability, supplemented by think-aloud qualitative data and task performance metrics.

---

## 1.5 Dissertation Structure

The remainder of this dissertation is structured as follows. **Chapter 2** presents a literature review of existing marketplace platforms, AI-driven pricing research, and the identified research gap. **Chapter 3** describes the methodology, including development approach, evaluation design, and success criteria. **Chapter 4** details the requirements specification and system design. **Chapter 5** covers the development and implementation of the system. **Chapter 6** presents the testing programme and analysis of results. **Chapter 7** provides a critical evaluation of the project against its objectives and success criteria. **Chapter 8** concludes the dissertation with a reflection on outcomes and directions for future work.

---

## References

Beck, K., Beedle, M., van Bennekum, A., Cockburn, A., Cunningham, W., Fowler, M., Grenning, J., Highsmith, J., Hunt, A., Jeffries, R., Kern, J., Marick, B., Martin, R.C., Mellor, S., Schwaber, K., Sutherland, J. and Thomas, D. (2001) *Manifesto for Agile Software Development*. Available at: https://agilemanifesto.org (Accessed: 23 March 2026).

Bocken, N.M.P., Bakker, C. and Pauw, I. de (2016) 'Product design and business model strategies for a circular economy', *Journal of Industrial and Production Engineering*, 33(5), pp. 308–320.

Brooke, J. (1996) 'SUS: A "quick and dirty" usability scale', in Jordan, P.W. et al. (eds) *Usability Evaluation in Industry*. London: Taylor and Francis, pp. 189–194.

Carroll, J.M. and Mack, R.L. (1984) 'Actively learning to use a word processor', in Nilsson, W.E. (ed.) *Advances in Human-Computer Interaction*, Vol. 1. Norwood: Ablex, pp. 259–282.

Chen, X. and Liu, Y. (2024) 'Trust formation in campus peer-to-peer platforms: Institutional identity as a social capital signal', *Computers in Human Behavior*, 152, p. 108043.

Heller, S. and Olsson, J. (2023) 'User-estimated pricing in recommerce: Valuation discrepancy and its effect on market liquidity', *Electronic Commerce Research and Applications*, 58, p. 101251.

Madurapperuma, M., Shafana, M. and Sabani, N. (2022) 'Comparing performance of web application development on Node.js and Django', in *Proceedings of the 2022 International Conference on Advanced Computing Technologies and Applications (ICACTA)*. IEEE, pp. 1–7.

Martinez, R. and Thompson, K. (2024) 'Machine learning approaches to second-hand book price prediction: A comparative analysis', *Journal of Electronic Commerce Research*, 25(1), pp. 44–61.

National Union of Students (2023) *Student Cost of Living Survey 2023*. London: NUS.

Orthian, B. (2024) 'Supabase as a backend-as-a-service for rapid application development: A practitioner review', *Journal of Open Source Software*, 9(94), p. 6211.

PMI (2021) *A Guide to the Project Management Body of Knowledge (PMBOK® Guide)*. 7th edn. Newtown Square: Project Management Institute.

Wang, L., Zhao, H., Patel, R. and Nguyen, T. (2023) 'Trading behaviours in student peer-to-peer marketplaces: A longitudinal study across five UK universities', *Computers & Education*, 198, p. 104756.
