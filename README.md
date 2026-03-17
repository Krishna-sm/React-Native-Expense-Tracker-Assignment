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
- React Native Cli
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


## Test Cases

### 1. "spent 500 on coffee"

* Expense added, shows in list
 <img width="1206" height="2622" alt="simulator_screenshot_8EE092BB-4855-4004-88E7-88FD54E05863" src="https://github.com/user-attachments/assets/2042e1fd-5cb1-4e74-ac22-adcba667aedf" />



### 2. "uber 350"

* Categorized as Transport
* Expense added, shows in list
<img width="1206" height="2622" alt="simulator_screenshot_454DC584-F84E-4DA8-B0D9-736CA52AF446" src="https://github.com/user-attachments/assets/f026193c-9c34-4db1-be24-68c0b8e99548" />

### 3. "netflix subscription 649"

* Categorized as Entertainment
* Merchant shown as Netflix
* Expense added, shows in list
<img width="1206" height="2622" alt="simulator_screenshot_1DA95849-8DCF-41C5-9069-B68C2EBE018D" src="https://github.com/user-attachments/assets/d5c63ce0-dc4a-44c9-bedd-e950c4824385" />


### 4. "coffee" (no amount)

* Shows error message
* Expense NOT added
<img width="1206" height="2622" alt="simulator_screenshot_CF19AE4E-398C-4586-8446-5EC11205CA4B" src="https://github.com/user-attachments/assets/4477aca8-c861-4a52-b193-1451911521d2" />

### 5. Random text "asdfgh"

* Shows error message
* Expense NOT added
<img width="1206" height="2622" alt="simulator_screenshot_198EA78B-3858-4E9F-B17A-3AD56ED687B3" src="https://github.com/user-attachments/assets/8940cab7-f329-4e40-bd98-cd8a3e08a871" />

### 6. Pull down on list

* List refreshes
* Latest expenses fetched and shown
  Simulator Screen Recording - iPhone 17 Pro - 2026-03-18 at 00.24.50

### 7. Tap delete on expense

* Confirmation dialog shown ("Delete this expense?")
<img width="1206" height="2622" alt="simulator_screenshot_6F45D4CE-2FA7-429C-9075-1067FDBFAA98" src="https://github.com/user-attachments/assets/d98deebd-600a-4e3d-8c23-1dc15a29a298" />

### 8. Confirm delete

* Expense removed from list
* Delete request sent successfully
<img width="1206" height="2622" alt="simulator_screenshot_48B6BD1A-39D1-4519-BC74-496A01191B12" src="https://github.com/user-attachments/assets/183382d1-752a-4c2c-9698-3e830451bf63" />

### 9. Cancel delete

* Expense stays in list
* No delete request sent
<img width="1206" height="2622" alt="simulator_screenshot_FF067B1E-B0A4-4F97-9F7A-1CF483F06EB2" src="https://github.com/user-attachments/assets/f979fd87-2d29-4a5c-832e-44ddb063a1e8" />

### 10. Kill app, reopen


* Previously added expenses still shown in list
* Data persisted across app restarts

 
https://github.com/user-attachments/assets/85e8f870-c1f0-4c72-abe3-c968e19e425b


## 📜 License

MIT - Feel free to use this for your own projects!


