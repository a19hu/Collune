

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e8af43bc-a91a-4bff-8ea7-5bf616a1bd56

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `VITE_API_BASE_URL` in `.env.local` to your backend, for example:
   `VITE_API_BASE_URL="http://localhost:8000/api/v1"`
3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
4. Run the app:
   `npm run dev`

## Production API URL

When this frontend is deployed over HTTPS, `VITE_API_BASE_URL` must also be HTTPS.
Do not point a deployed frontend to a local/LAN backend such as `http://172.20.10.2:8000`.

Use one of these options:

- Deploy the backend publicly with HTTPS and set `VITE_API_BASE_URL` to that URL.
- Proxy `/api/v1` from the same frontend domain to the backend with HTTPS.
