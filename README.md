# AI Expense Tracker

A full-stack expense tracking app that uses AI to parse natural language input.

Built by: Krishhna Bansal
GitHub: krishna-sm
Time to build: 40min (with Cursor)

## 🎥 Demo

 

https://github.com/user-attachments/assets/85e8f870-c1f0-4c72-abe3-c968e19e425b



## 🛠️ Tech Stack

- **Mobile:** React Native, Expo, TypeScript
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite
- **AI:** Groq API

## 🚀 Setup Instructions

### Prerequisites
- Node.js 20+
- npm or yarn
- Expo CLI
- Groq API key

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Add your AI API key to .env
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npm start
# Scan QR code with Expo Go app
```

## 📁 Project Structure 

- **`backend/`**: Node.js + Express (TypeScript) API server  
  - **`src/index.ts`**: Server entrypoint, CORS/JSON middleware, `/health`, mounts routes  
  - **`src/routes/expenses.ts`**: REST endpoints (`POST /api/expenses`, `GET /api/expenses`, `DELETE /api/expenses/:id`)  
  - **`src/services/ai.ts`**: Calls Groq/OpenAI-compatible API to parse natural language into structured expense JSON  
  - **`src/database/db.ts`**: SQLite setup (`better-sqlite3`), table init, and CRUD functions  
  - **`.env / .env.example`**: Config for port, DB path, and AI credentials/model

- **`mobile/`**: React Native app (TypeScript)  
  - **`App.tsx`**: App entry; renders the main expense tracker screen  
  - **`src/screens/ExpenseTrackerScreen.tsx`**: Single-screen UI (input, success card, list, refresh, delete)  
  - **`src/services/api.ts`**: Client for backend API (add/get/delete expenses)  
  - **`src/types/expense.ts`**: Shared `Expense` type for type-safe UI rendering

## 🤖 AI Prompt Design

I used this system prompt for expense parsing:
You are an expense parser. Extract expense information from natural language input.

RULES:
1. Extract the amount as a number (no currency symbols)
2. Default currency is INR unless explicitly mentioned (USD, EUR, etc.)
3. Categorize into EXACTLY one of these categories:
   - Food & Dining (restaurants, cafes, food delivery, groceries)
   - Transport (uber, ola, taxi, fuel, parking, metro)
   - Shopping (clothes, electronics, amazon, flipkart)
   - Entertainment (movies, netflix, spotify, games)
   - Bills & Utilities (electricity, water, internet, phone)
   - Health (medicine, doctor, gym, pharmacy)
   - Travel (flights, hotels, trips)
   - Other (anything that doesn't fit above)
4. Description should be a clean summary (not the raw input)
5. Merchant is the company/store name if mentioned, null otherwise

RESPOND ONLY WITH VALID JSON, no other text:
{
  "amount": <number>,
  "currency": "<string>",
  "category": "<string>",
  "description": "<string>",
  "merchant": "<string or null>"
}

If the input is invalid or you cannot extract an amount, respond:
{
  "error": "Could not parse expense. Please include an amount.",
  "amount": null
}

**Why this approach:**  
I constrained the model to return **only valid JSON** with a fixed schema and a small, **closed set of categories** to avoid inconsistent outputs. I also added explicit fallbacks (default INR/Other, null merchant, and an error object when no amount is present) to handle edge cases reliably.

## ⏱️ Time Breakdown

| Task | Time |
|------|------|
| Setup | 5 min |
| Backend | 10 min |
| AI Integration | 7 min |
| Mobile App | 13 min |
| Testing & Polish | 5 min |
| **Total** | **40 min** |

## 🔮 What I'd Add With More Time

- [ ] Edit expense + recategorize flow  
- [ ] Offline-first caching + retry queue for failed requests  
- [ ] Basic analytics screen (category totals + monthly summary)

## 📝 AI Tools Used

- **Cursor**: Generated boilerplate + iterated quickly on backend routes, DB layer, and RN UI  
- **ChatGPT**: Prompt design + edge-case handling guidance and debugging

Most helpful prompt: "**Create Express.js routes in TypeScript for an expense tracker API (POST/GET/DELETE) using existing parseExpense + SQLite CRUD, with validation and consistent responses**"

## 📜 License

MIT - Feel free to use this for your own projects!


