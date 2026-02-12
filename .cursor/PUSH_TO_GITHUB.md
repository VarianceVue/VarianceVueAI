# Push This Repo to GitHub — Step by Step

Use these steps to put **ECEPCS MASTER** on GitHub so you can connect it to Vercel (or use it from another machine).

---

## Step 1: Install Git (if you don’t have it)

1. Go to **https://git-scm.com/download/win**
2. Download and run the installer (use default options).
3. Close and reopen PowerShell or Terminal so `git` is available.
4. Check: open a new terminal and run:
   ```bash
   git --version
   ```
   You should see something like `git version 2.43.0`.

---

## Step 2: Create a new repository on GitHub

1. Sign in at **https://github.com**
2. Click the **+** (top right) → **New repository**
3. Fill in:
   - **Repository name:** e.g. `ECEPCS-MASTER` or `ecepcs-schedule-agent` (no spaces).
   - **Description:** optional (e.g. “Earned Schedule Excellence Project Controls System”).
   - **Public** or **Private** — your choice.
   - **Do not** check “Add a README” or “Add .gitignore” (we already have files).
4. Click **Create repository**
5. Leave the page open; you’ll need the repo URL (e.g. `https://github.com/YourUsername/ECEPCS-MASTER.git`).

---

## Step 3: Open a terminal in your project folder

1. In File Explorer, go to:
   ```
   c:\Users\vivek\OneDrive\Desktop\Project_Controls\ECEPCS MASTER
   ```
2. In the address bar, type `powershell` and press Enter (opens PowerShell in that folder).  
   **Or** in Cursor: **Terminal → New Terminal** and run:
   ```bash
   cd "c:\Users\vivek\OneDrive\Desktop\Project_Controls\ECEPCS MASTER"
   ```

---

## Step 4: Initialize Git and make the first commit

Run these commands **one at a time** in that folder:

```powershell
git init
```

```powershell
git add .
```

```powershell
git status
```
(You should see a list of files to be committed.)

```powershell
git commit -m "Initial commit: ECEPCS Schedule Agent and Vercel setup"
```

---

## Step 5: Connect to GitHub and push

Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual GitHub username and repo name (e.g. `vivek` and `ECEPCS-MASTER`).

**If you use HTTPS (easiest):**

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

**If you use SSH (after you’ve set up an SSH key on GitHub):**

```powershell
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

Then:

```powershell
git branch -M main
git push -u origin main
```

- The first time with **HTTPS**, GitHub may ask you to sign in (browser or credential helper).
- If it asks for **username**: your GitHub username.  
- If it asks for **password**: use a **Personal Access Token** (GitHub no longer accepts account passwords). To create one: GitHub → **Settings → Developer settings → Personal access tokens → Generate new token**; give it “repo” scope and paste it when prompted.

---

## Step 6: Confirm on GitHub

Refresh your repository page on GitHub. You should see all your project files (`.cursor`, `schedule_agent_web`, `app.py`, `public`, etc.).

---

## Quick reference (after Step 3)

| What you’re doing        | Command |
|--------------------------|--------|
| Initialize repo          | `git init` |
| Stage all files           | `git add .` |
| First commit              | `git commit -m "Initial commit: ECEPCS Schedule Agent and Vercel setup"` |
| Add GitHub remote (HTTPS) | `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git` |
| Use main branch           | `git branch -M main` |
| Push to GitHub            | `git push -u origin main` |

---

## Later: make changes and push again

```powershell
git add .
git commit -m "Short description of what you changed"
git push
```

---

## Troubleshooting

- **“git is not recognized”**  
  Install Git (Step 1) and open a **new** terminal.

- **“Permission denied” or “Authentication failed”**  
  For HTTPS: use a [Personal Access Token](https://github.com/settings/tokens) instead of your password.  
  For SSH: add your SSH key in GitHub **Settings → SSH and GPG keys**.

- **“remote origin already exists”**  
  You already added the remote. To change it:
  ```powershell
  git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
  ```

- **“failed to push some refs”**  
  If GitHub shows a non-empty repo (e.g. with a README), pull first then push:
  ```powershell
  git pull origin main --allow-unrelated-histories
  git push -u origin main
  ```
