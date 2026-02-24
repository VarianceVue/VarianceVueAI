<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1U9ETu54FUd3JB2AZvTDEpc5nWL7NTJCc

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Update the webpage (Ingestion tab, buttons)

The backend serves the built app from `schedule_agent_web/static`. To see the latest UI (Scope, Sample schedule, Site pictures):

1. From this folder (`vuelogic-ui`): run **`npm run build`**
2. Build output is written to `../schedule_agent_web/static`
3. Restart the backend if it’s running, then hard-refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
