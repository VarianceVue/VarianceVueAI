# Earned Schedule Advanced (Walter Lipke) — Toggle & Reference

The **Earned Schedule (Lipke) advanced** skill extends the EV/cost agent with **Walter Lipke** methodology (TSPI, P-Factor, advanced EAC(t), etc.). It is **toggle-gated**: used **only when** you enable ES Advanced Mode.

---

## 1. Toggle — Enable / Disable ES Advanced

| Action | How |
|--------|-----|
| **Enable** | Create the file **`.cursor/es_advanced_on`** in the project root (empty file or with `1` inside). |
| **Disable** | Delete **`.cursor/es_advanced_on`**. |

- **When ON**: The EV/cost agent may use the **es-advanced-skill** and Walter Lipke methodology (TSPI, P-Factor, EAC(t) per Lipke, reference to Lipke papers).
- **When OFF**: Only standard Earned Schedule (ES, AT, SV(t), SPI(t), EAC(t), VAC(t)) from the cost-agent; no Lipke-specific formulas or TSPI.

---

## 2. Reference — Walter Lipke Materials

The advanced skill reads from **`reference/Walter_Lipke/`** in the project. Put **extracted text** from Lipke PDFs and key docs there so the agent can apply his methodology.

### Your Lipke folder (example)

You have Lipke materials at:

- **Folder**: `C:\Users\vivek\Downloads\OneDrive_1_2-2-2026\Walter Lipke`
- **Key PDF**: `Lipke 2022 (UT Dallas Symposium) Earned Schedule Application of the To Complete Schedule Performance Index v1.pdf`
- **Other PDFs**: e.g. `Earned Schedule a Breakthrough Extension to EVM - Henderson.pdf`
- **Excel calculators**: ES Calculator, P-Factor, TSPI, Stability Point, etc. (agent cannot read Excel; you can paste formulas or results into `.txt`/`.md` in `reference/Walter_Lipke/` if needed)

### Extract PDFs into the project

**Option A — Batch (recommended)**  
From the project root:

```powershell
python scripts/extract_lipke_pdfs.py "C:\Users\vivek\Downloads\OneDrive_1_2-2-2026\Walter Lipke"
```

This extracts **all** PDFs in that folder into **`reference/Walter_Lipke/`** as `.txt` files.

**Option B — Single PDF**  
Using the existing extract script:

```powershell
python .cursor/skills/project-controls-agent/scripts/extract_pdf.py "C:\Users\vivek\Downloads\OneDrive_1_2-2-2026\Walter Lipke\Lipke 2022 (UT Dallas Symposium) Earned Schedule Application of the To Complete Schedule Performance Index v1.pdf" > reference/Walter_Lipke/Lipke_2022_TSPI.txt
```

Repeat for other PDFs and save each output to a file under **`reference/Walter_Lipke/`**.

---

## 3. Usage

1. **Enable** ES Advanced: create **`.cursor/es_advanced_on`**.
2. **Extract** Lipke PDFs into **`reference/Walter_Lipke/`** (run the batch script or single-PDF commands above).
3. In Chat or Composer, ask about **Earned Schedule**, **TSPI**, **EAC(t)** method, **Lipke**, or **advanced ES**; the agent will use the es-advanced-skill and reference the Lipke materials when the toggle is on.
4. To turn off advanced ES, delete **`.cursor/es_advanced_on`**.

---

## 4. Summary

| Item | Location / Action |
|------|-------------------|
| **Toggle ON** | Create **`.cursor/es_advanced_on`** |
| **Toggle OFF** | Delete **`.cursor/es_advanced_on`** |
| **Lipke reference** | **`reference/Walter_Lipke/`** — place extracted PDF text and key docs here |
| **Batch extract** | `python scripts/extract_lipke_pdfs.py "C:\...\Walter Lipke"` |
| **Skill** | **.cursor/skills/es-advanced-skill/** — only used when toggle is on and user asks about ES/TSPI/Lipke |
