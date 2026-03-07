# Real-Hero: Machine Learning Models Documentation 🧠🩸

The Real-Hero platform incorporates **8 distinct Machine Learning & AI models** to optimize blood donation matching, predict shortages, personalize donor experiences, and analyze platform data.

Our ML infrastructure is divided into two layers:
1. **Python AI Core (`/backend/ai`)**: A dedicated FastAPI microservice running predictive models (Logistic Regression, Random Forest, Holt-Winters, K-Means).
2. **Node.js Business Logic (`/backend/controllers/analyticsController.mjs`)**: Orchestrates data, formats outputs, and provides intelligent fallbacks if the Python core is unreachable.

---

## 1. Donor Readiness Score (Model 1)
**Purpose:** Evaluates how physically and temporally prepared a donor is to give blood safely.
- **Where it's used:** Analytics Dashboard (Gauge Chart).
- **How it works (Algorithm & Logic):** 
  - Uses a **Weighted Multi-Factor Scoring Algorithm (0-100 scale)**.
  - **Factors calculated:**
    - **Rest Period (30 pts):** Based on the legal 90-day cooldown between donations.
    - **Weight (20 pts):** Minimum 50kg requirement for whole blood donation.
    - **Age (15 pts):** Optimal bracket is 18-45, eligible is up to 65.
    - **Blood Rarity Bonus (10 pts):** Rare types (O-, AB-) get higher baseline urgency points.
    - **Reliability (15 pts):** Based on past pledge fulfillment tracking.
    - **Availability Flag (10 pts):** Whether the donor is currently marked active.
- **Output:** A score (e.g., 85/100) and a category ("Ready to Donate", "Almost Ready", "Not Yet Eligible") along with the expected exact date they will be eligible next.

## 2. Blood Shortage Risk Classifier (Model 2)
**Purpose:** Predicts the real-time risk of a blood shortage for specific blood groups.
- **Where it's used:** Analytics Dashboard (Risk Progress Bars).
- **How it works (Algorithm & Logic):**
  - **Primary Engine:** Python `RandomForestClassifier`.
  - Maps live active regional requests (status: `pending/open/primary_assigned`) against currently available donors.
  - Features analyzed: `blood_rarity`, `donor_density`, `search_radius`, `hour_of_day`, `urgency`.
  - **Node.js Fallback Heuristic:** If the Python service is down, it calculates `Risk = (Active Requests / (Available Donors + 1)) × Rarity Weight`.
- **Output:** Categorizes each blood group into **Critical**, **High**, **Medium**, or **Low** risk, visualizing the gap between demand and supply.

## 3. 7-Day Demand Simulation (Model 3)
**Purpose:** Forecasts the expected number of blood requests for the upcoming week to help hospitals and donors plan ahead.
- **Where it's used:** Analytics Dashboard (Live Bar Chart).
- **How it works (Algorithm & Logic):**
  - **Engine:** Python `ExponentialSmoothing` (Holt-Winters Time Series Forecasting).
  - The Node.js backend extracts the last **60 days of real request history** from MongoDB, grouped by date, and feeds it into the Python model.
  - The model detects **trend** (increasing/decreasing demand) and **seasonality** (e.g., weekend spikes) to project the next 7 days.
  - It identifies **Surge Days** (weekends and month-end) automatically.
  - **Node.js Fallback:** Uses a 60-day moving average multiplied by a complex weekday/month-end seasonality matrix and rarity weights.
- **Output:** A day-by-day request count prediction with "Normal day" vs "Surge day" highlighting, completely live and polled every 60 seconds.

## 4. Donor Loyalty Tier - RFR Model (Model 4)
**Purpose:** Segments and gamifies the donor base using an RFM (Recency, Frequency, Monetary) style scoring system adapted for blood donation (RFR: Recency, Frequency, Reliability).
- **Where it's used:** Analytics Dashboard (Loyalty Badge).
- **How it works (Algorithm & Logic):**
  - **Engine:** Python K-Means Clustering for segmentation + Node heuristic exact scoring.
  - **Recency (R - max 40):** How many days since the last donation (fewer days = higher score). 
  - **Frequency (F - max 40):** Total lifetime donations (higher count = better tier).
  - **Reliability (R - max 20):** Platform reliability score (did they show up when requested?).
- **Output:** Assigns a tier based on total score (0-100):
  - 🌱 **New Hero** (<30)
  - 🦸 **Active Hero** (30-54)
  - 🏆 **Champion** (55-79)
  - 👑 **Legendary** (80+)

## 5. Peak Timing Predictor (Model 5)
**Purpose:** Analyzes platform data to recommend the exact day and time a donor should schedule their donation for maximum impact.
- **Where it's used:** Analytics Dashboard (Best Time to Donate cards).
- **How it works (Algorithm & Logic):**
  - Aggregates historical request timestamps filtered specifically by the logged-in user's blood group.
  - Generates a Day-of-Week frequency distribution map to find the absolute peak day.
  - Evaluates standard medical time slots (Morning, Late Morning, Afternoon, Evening) against the platform's historical surge windows.
- **Output:** Recommends a specific day (e.g., "Saturday") and time slot (e.g., "11AM-1PM") highlighting when their specific blood type is statistically most needed.

## 6. 12-Month Impact Trajectory (Model 6)
**Purpose:** Projects a donor's future impact to encourage long-term commitment.
- **Where it's used:** Analytics Dashboard (Line Chart Projection).
- **How it works (Algorithm & Logic):**
  - Extracts the donor's monthly donation frequency over the last 6 months.
  - Applies a **Linear Regression Analysis** (`y = mx + b`) to calculate the trajectory slope.
  - Projects the cumulative donation count 12 months into the future.
  - Automatically calculates secondary impact metrics (e.g., `Predicted Donations × 3 = Projected Lives Saved`).
- **Output:** A visualization of their monthly predicted cadence vs. cumulative growth, identifying whether their donation trend is "increasing", "decreasing", or "steady".

## 7. Generative Insight Briefing (Model 7)
**Purpose:** Provides a human-readable, AI-synthesized morning briefing tailored exactly to the donor's current status and platform needs.
- **Where it's used:** Analytics Dashboard (Generative Briefing Box).
- **How it works (Algorithm & Logic):**
  - Assesses multidimensional data simultaneously: The donor's cooldown status, their specific blood group, the time of day, and the platform's most critically needed blood group in real-time.
  - Generates contextual insights through a rule-based NLP synthesis engine.
  - For example, if the platform is desperate for O- and the user is O- and off cooldown, it triggers an "URGENT AI MATCH" specific prompt.
- **Output:** A dynamic, natural language briefing sentence summarizing their next best action.

## 8. AI Health & Recovery Advisor (Model 8)
**Purpose:** Guides the donor through the biometric recovery phases after a donation.
- **Where it's used:** Analytics Dashboard (Recovery Protocol UI).
- **How it works (Algorithm & Logic):**
  - Acts as a **Biometric Recovery Stage Classifier**.
  - Calculates the exact hours/days elapsed since the donor's last recorded donation.
  - Maps this elapsed time to physiological recovery thresholds:
    - *0-24h:* Immediate Recovery (Volume regeneration)
    - *Day 1-7:* Volume Restoration 
    - *Day 7-30:* Hemoglobin Synthesis
    - *Day 30+:* Late Recovery / Prime Readiness
  - Dispatches phase-specific actionable advice regarding Diet (e.g., Iron-rich foods) and Lifestyle/Activity (e.g., Gym avoidance).
- **Output:** A granular recovery percentage (e.g., 60%), current phase categorization, and a checklist of tailored nutritional/activity protocols.
