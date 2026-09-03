# AI Bhaav-Taav (Bargain) Agent — Setup Guide

## 1. Init project & install dependencies

```bash
npx create-next-app@latest bhaav-taav-agent --js --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd bhaav-taav-agent

npm install razorpay @google/generative-ai
```

When `create-next-app` asks questions, accept the defaults shown in the flags above (App Router: yes, Tailwind: yes).

Then copy in the files from this bundle, overwriting/adding:
- `app/layout.js`
- `app/globals.css`
- `app/page.js`
- `app/components/ProductCard.jsx`
- `app/components/ChatWidget.jsx`
- `app/api/chat/route.js`
- `app/api/payment/route.js`
- `.env.local` (create this yourself, see below — never commit it)

## 2. `.env.local`

Create a file named `.env.local` in the project root:

```bash
# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Razorpay TEST mode keys (from Razorpay Dashboard > Settings > API Keys, toggle to Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_key_secret

# Exposed to the browser to open the Razorpay Checkout widget (same as RAZORPAY_KEY_ID)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

Get a Gemini key at https://aistudio.google.com/app/apikey
Get Razorpay TEST keys at https://dashboard.razorpay.com/app/keys (make sure "Test Mode" toggle is on, top right)

## 3. Run

```bash
npm run dev
```

Open http://localhost:3000, click "Negotiate Price", haggle with the AI shopkeeper. When you agree on a number, the widget auto-creates a Razorpay test order and pops the Checkout modal. Use Razorpay's test card `4111 1111 1111 1111`, any future expiry, any CVV, to complete payment.

## How the negotiation logic is bounded (important for the demo/judges)

- The hard floor (₹1900) and target close range (₹2100–₹2200) live in the **system prompt only** — the model never sees or is told the floor is negotiable.
- The API route (`app/api/chat/route.js`) does a **second, code-level safety check**: even if the model ever returns a `final_price` below ₹1900 (hallucination/jailbreak), the route clamps/rejects it before it can ever reach the payment step. This is the belt-and-braces part worth mentioning to judges — the LLM's word is never trusted blindly for the actual money-moving step.
- The deal is detected via a strict trailing JSON block (`{"deal_reached": true, "final_price": N}`) that the model is instructed to emit only once terms are confirmed. The frontend strips that block out of what's displayed as the chat bubble text.
