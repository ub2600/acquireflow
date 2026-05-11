# AcquireFlow – UK Company Acquisition Target Finder

Pure Python. Works on Python 3.9 through 3.14+.
No Rust. No compilation. No Visual Studio required.

---

## Quick Start – Windows EXE (No Python Needed)

1. Go to the [**Releases page**](https://github.com/ub2600/acquireflow/releases/latest)
2. Download `AcquireFlow-Windows.zip`
3. Extract the zip to any folder
4. Rename `.env.example` to `.env` and paste your [Companies House API key](https://developer.company-information.service.gov.uk)
5. Double-click `AcquireFlow.exe`
6. Your browser opens to http://localhost:8000 — start searching!

---

## Developer Setup (Python)

### Step 1 – Get Your Companies House API Key (2 minutes)
1. Go to: https://developer.company-information.service.gov.uk
2. Click **Sign up** → create a free account
3. Click **Create an application** → give it any name
4. Copy your **API key** (looks like: b5274042-84f5-4979-860d-ff382c74a2d3)

---

### Step 2 – Set Up the .env File
1. In the `acquireflow` folder, find `.env.`
2. Replace `your_api_key_here` with your real API key:
   ```
   COMPANIES_HOUSE_API_KEY=b5274042-84f5-4979-860d-ff382c74a2d3
   ```
3. Save and close

---

### Step 3 – Run the App
Open Command Prompt in the `acquireflow` folder and run:
```
python run.py
```

The script will:
- Install Flask and other dependencies automatically (no Rust, no compiling)
- Start the web server
- Open your browser to http://localhost:8000

---

### Step 4 – Use the Tool
1. **SIC Code** – Industry code, e.g. `49320` (taxi/minicab)
   - Find codes at: https://resources.companieshouse.gov.uk/sic/
2. **Postcode / Town** – e.g. `SW1A 1AA` or `Manchester`
3. **Radius** – miles from the postcode
4. **Min Director Age** – at least one active director must be this age or older
5. **Min Company Age** – years since incorporation
6. **Max Companies** – how many to fetch from Companies House
7. Click **Search** and watch the live progress

---

### Step 5 – Review & Export
- **Green rows** = companies meeting all criteria
- **Score** = Buy score 1–10 (higher is better)
- **Details** button = full director ages and score breakdown
- **Criteria only** toggle = hide non-qualifying companies
- **↓ CSV** or **↓ Excel** = download results

---

## Starting Again Later
Every time you want to use the tool:
```
cd path\to\acquireflow
python run.py
```
Then open: http://localhost:8000

---

## Buy Score (1–10)
| Dimension | Max | How |
|---|---|---|
| Company Age | 3 pts | Scales with how much it exceeds the minimum |
| Director Quality | 4 pts | 2.5 for first qualifying director, +0.5 each extra |
| Location Proximity | 3 pts | Full points at centre, zero at radius edge |

🟢 Score ≥ 7 = Strong target
🟡 Score 4–6 = Worth reviewing
🔴 Score < 4 = Weak match

---

## Troubleshooting
| Problem | Fix |
|---|---|
| `⚠ No API key` in the UI | Edit .env, paste your real key, restart |
| 0 results | Verify the SIC code exists; try a broader radius |
| Port already in use | Close other apps on port 8000 |
| Any install error | Run `pip install flask flask-cors requests openpyxl python-dotenv` manually |

---

## Folder Structure
```
acquireflow/
├── app/
│   ├── main.py       ← Flask app (all backend logic)
│   └── __init__.py
├── static/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── data/             ← SQLite DB (auto-created)
├── exports/          ← Export files (auto-created)
├── .env              ← YOUR API KEY (you create this)
├── requirements.txt
├── run.py            ← Start the app
└── README.md
```

---

## Backing Up Your Data
Your search history is in: `acquireflow/data/acquireflow.db`
To back up: copy that file somewhere safe.
To restore: copy it back before running the app.

---

*AcquireFlow v1.0 – Built for kyle8888*
