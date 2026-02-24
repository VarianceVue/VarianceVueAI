# Deploy VueLogic on a Desktop (for Your Client)

Run the Schedule Agent (VueLogic) on a Windows PC so your client can use it in their browser. **File upload works when run on desktop** because the app uses the full FastAPI backend instead of serverless.

---

## Option A: One-time setup on the client’s PC (recommended)

### 1. Install Python

- Download **Python 3.10 or 3.11**: https://www.python.org/downloads/
- Run the installer and **check “Add Python to PATH”**.
- Finish the install.

### 2. Copy the project folder

- Copy the whole project folder (e.g. `ECEPCS MASTER`) to the client’s PC (e.g. `C:\VueLogic` or Desktop).

### 3. Create a virtual environment and install dependencies

Open **Command Prompt** or **PowerShell** in the project folder:

```cmd
cd "C:\VueLogic"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Set the API key (required for chat)

Create a file named **`.env`** in the project folder (same folder as `requirements.txt`) with one of these:

**Using OpenAI:**

```env
OPENAI_API_KEY=sk-your-openai-key-here
```

**Using Claude:**

```env
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

Save the file. The app will read it when it starts.

### 5. (Optional) Persistence – conversation history and lessons

If you want conversation history, lessons learned, and trust score to persist:

- Create a free **Upstash Redis** database: https://upstash.com/
- In the Upstash dashboard, copy the **REST URL** and **REST TOKEN**.
- Add them to `.env`:

```env
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

If you skip this, the app still runs; history and lessons just won’t be saved between restarts.

### 6. Start the app

**Option 1 – Double‑click:**

- Double‑click **`run_desktop.bat`** in the project folder.  
- A browser window should open at http://localhost:8000.  
- If it doesn’t, open a browser and go to: **http://localhost:8000**

**Option 2 – Command line:**

```cmd
cd "C:\VueLogic"
venv\Scripts\activate
python -m uvicorn schedule_agent_web.main:app --host 0.0.0.0 --port 8000
```

Then open a browser and go to: **http://localhost:8000**

### 7. Use the app

- Chat with VueLogic (scheduling questions).
- Use **Upload File** to add CSV, .xer, .md, .txt, etc.; these are sent to the same backend, so upload works on desktop.
- To stop the app: close the Command Prompt window (or press Ctrl+C in the terminal).

---

## Option B: Let the client run it with a shortcut

1. Do **Option A** once on the client’s PC (steps 1–5).
2. Right‑click **`run_desktop.bat`** → **Create shortcut**.
3. Move the shortcut to the Desktop or Start Menu.
4. Tell the client: “Double‑click **VueLogic** (or the shortcut name). When the browser opens, use the app. When done, close the black window to stop it.”

---

## Option C: Other PCs on the same network (optional)

If you started the app with `run_desktop.bat` or with `--host 0.0.0.0`, other PCs on the same LAN can use it:

1. On the PC where the app is running, find its IP:  
   **Command Prompt** → `ipconfig` → note **IPv4 Address** (e.g. `192.168.1.100`).
2. On another PC’s browser, open: **http://192.168.1.100:8000** (use that IP).

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Python not found” | Install Python and tick “Add Python to PATH”, or use the full path to `python.exe` in the batch file. |
| “No module named …” | Run `pip install -r requirements.txt` inside the activated venv. |
| Chat says “Set OPENAI_API_KEY or ANTHROPIC_API_KEY” | Create `.env` in the project folder with one of the keys (step 4). |
| Browser doesn’t open | Manually open http://localhost:8000 |
| Port 8000 in use | Use a different port: `uvicorn schedule_agent_web.main:app --host 0.0.0.0 --port 8001` and open http://localhost:8001 |
| Upload “not working” on Vercel | Use desktop deployment; upload is handled correctly by the FastAPI backend when run on desktop. |

---

## Summary for your client

1. Install Python (with “Add to PATH”).
2. Copy the project folder to their PC.
3. In that folder: `python -m venv venv` → `venv\Scripts\activate` → `pip install -r requirements.txt`.
4. Add `.env` with `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`.
5. Double‑click **`run_desktop.bat`** and use http://localhost:8000 in the browser.
6. File upload and chat work on this desktop setup.
