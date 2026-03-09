# Quick Setup Guide: Google Forms for User Testing

## Overview

Based on your 60-minute testing session structure and methodology, you need **5 Google Forms**:

| Form | Duration | Purpose |
|------|----------|---------|
| Form 1: Pre-Task Questionnaire | 5 min | Demographics, prior experience, baseline attitudes |
| Form 2: Task Performance Recording | 35 min | Observer records during task execution |
| Form 3: Post-Task SUS Questionnaire | 10 min | System Usability Scale + satisfaction ratings |
| Form 4: Semi-Structured Interview | 5 min | Qualitative feedback capture |
| Form 5: Task Scripts | N/A | Printed/shared task instructions |

---

## Creating the Forms in Google Forms

### Step-by-Step Process:

1. Go to [forms.google.com](https://forms.google.com)
2. Click **+ Blank** to create a new form
3. Copy the title and description from `USER_TESTING_FORMS.md`
4. Add questions using the appropriate question types:
   - **Multiple choice**: Use for single-select options
   - **Checkboxes**: Use for "select all that apply"
   - **Linear scale**: Use for 1-5 ratings
   - **Short answer**: Use for text inputs
   - **Paragraph**: Use for long answer text
   - **Time**: Use for time recording
   - **Date**: Use for session dates

### Question Type Mapping:

| In Document | Google Forms Type |
|-------------|-------------------|
| `[ ]` with single select | Multiple choice |
| `[ ]` with "Select all" | Checkboxes |
| `Short answer text` | Short answer |
| `Long answer text` | Paragraph |
| `Time picker` | Time |
| `Date picker` | Date |
| Likert scale (1-5) | Linear scale |

---

## Your 5 Core User Tasks Mapped to Forms

| Task | Target Time | Captured In |
|------|-------------|-------------|
| 1. Create account & profile | <3 min | Form 2 Section 2 |
| 2. Create listing with AI pricing | <5 min | Form 2 Section 3 |
| 3. Search and filter items | <2 min | Form 2 Section 4 |
| 4. Contact seller | <1 min | Form 2 Section 5 |
| 5. View and edit listings | <2 min | Form 2 Section 6 |

---

## Data Collection Aligned with Your Methodology

### Quantitative Data Collected:

| Metric | Where Captured | Analysis |
|--------|----------------|----------|
| Task completion time | Form 2 (T#.3) | Mean, median, SD |
| Task success rate | Form 2 (T#.4) | Binary success/failure |
| Error counts | Form 2 (T#.5) | Count per task |
| SUS scores | Form 3 (SUS1-10) | Target: ≥70/100 |
| AI price acceptance | Form 2 (T2.8) | Acceptance rate % |
| NPS score | Form 3 (CA2) | Recommendation likelihood |

### Qualitative Data Collected:

| Method | Where Captured | Analysis |
|--------|----------------|----------|
| Think-aloud observations | Form 2 (T#.7/9/10) | Thematic coding |
| Critical incidents | Form 2 Section 7 | Critical incident technique |
| Interview responses | Form 4 (INT1-17) | Affinity diagramming |
| Feature requests | Form 4 (INT10-12) | Theme clustering |
| Nielsen heuristic issues | Form 4 (NH1-10) | Heuristic evaluation mapping |

---

## Session Flow Checklist

### Introduction Phase (5 min)
- [ ] Explain study purpose
- [ ] Obtain consent (Form 1, Q1)
- [ ] Send Form 1: Pre-Task Questionnaire link
- [ ] Explain think-aloud protocol

### Task Execution Phase (35 min)
- [ ] Share Form 5: Task Scripts (print or screen share)
- [ ] Observer opens Form 2: Task Performance Recording
- [ ] Start screen recording
- [ ] Guide participant through Tasks 1-5
- [ ] Record times, errors, and observations in real-time

### Post-Task Questionnaire (10 min)
- [ ] Send Form 3: Post-Task SUS Questionnaire link
- [ ] Wait for completion

### Semi-Structured Interview (5 min)
- [ ] Interviewer opens Form 4
- [ ] Ask open-ended questions
- [ ] Record responses
- [ ] Thank participant

---

## Key Metrics Summary

### Target Benchmarks:

| Metric | Target | Pass/Fail |
|--------|--------|-----------|
| Task 1 completion | <3 min (180s) | ≥80% success |
| Task 2 completion | <5 min (300s) | ≥80% success |
| Task 3 completion | <2 min (120s) | ≥80% success |
| Task 4 completion | <1 min (60s) | ≥80% success |
| Task 5 completion | <2 min (120s) | ≥80% success |
| SUS score | ≥70/100 | Good usability |
| AI acceptance rate | Track % | No target (exploratory) |

---

## Post-Study Analysis Workflow

1. **Export all form responses** to Google Sheets
2. **Calculate quantitative metrics:**
   - Task completion times (mean, median, SD)
   - Success rates per task
   - Error frequencies
   - SUS scores using the calculation formula
   - AI acceptance rates

3. **Analyze qualitative data:**
   - Transcribe think-aloud comments
   - Code themes using open/axial coding
   - Create affinity diagrams
   - Map issues to Nielsen's heuristics
   - Generate actionable insights

4. **Create findings report** with:
   - Executive summary
   - Quantitative results tables
   - Qualitative theme analysis
   - Prioritized issue list
   - Recommendations

---

## Sample Size Recommendation

For usability testing with think-aloud protocol:
- **Minimum:** 5 participants (discovers ~80% of usability issues)
- **Recommended:** 8-12 participants (statistical significance for quantitative metrics)
- **Target:** 10 participants (balances thoroughness with feasibility)

---

## Files Created

| File | Description |
|------|-------------|
| `USER_TESTING_FORMS.md` | Complete form content to copy into Google Forms |
| `USER_TESTING_QUICK_SETUP.md` | This quick setup guide |

Good luck with your user testing!
