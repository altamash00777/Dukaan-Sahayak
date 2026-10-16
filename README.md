
# 🛒 Dukaan Sahayak — AI-Powered Shop Assistant

deployed link-https://dukaan-sahayak.vercel.app/

> *Apni Dukaan, Digital Banao*

**Dukaan Sahayak** helps Kirana shops, tailors, and street vendors manage their business digitally — without needing accounting knowledge. Shopkeepers can speak or type in Hindi, Hinglish, or English; the AI understands, creates bills, tracks inventory, maintains a digital Khata, and sends invoices via WhatsApp.

---

## 🏆 Hackathon: MLH

**Problem Statement:** Kirana shops, tailors, and street vendors often keep no digital records, and GST, UPI, and ONDC feel out of reach. Build a lightweight assistant that turns a shopkeeper's voice or text notes into a sales ledger, stock list, or GST-ready summary, ideally delivered over WhatsApp.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Assistant** | Understands Hindi, Hinglish & English. Type "Ramesh ko 2 kilo chawal bechi" and it creates a bill |
| 🧾 **Smart Billing** | Itemized invoices with GST, PDF generation, WhatsApp delivery |
| 📦 **Inventory** | Real-time stock tracking, low-stock alerts, purchase recording |
| 📒 **Digital Khata** | Customer credit book, payment recording, WhatsApp reminders |
| 📊 **Reports** | Daily/monthly sales, GST summaries, bestseller analysis, CSV export |
| 🎙️ **Voice Input** | Web Speech API for hands-free entry |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + CSS3 |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas + Mongoose |
| **AI Model** | **Google Gemma 4** (`gemma-4-26b-a4b-it`) via **Gemini API** 💎 |
| **AI SDK** | Google Gemini API (OpenAI-compatible endpoint) |
| **Messaging** | WhatsApp Business Cloud API |
| **PDFs** | PDFKit |
| **Charts** | Recharts |
| **Auth** | JWT + bcrypt |
| **Validation** | Zod |
| **Security** | Helmet + rate-limiting + CORS |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))
- WhatsApp Business Cloud API credentials (optional for MVP)

### 1. Clone & Install

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GROQ_API_KEY=gsk_...
```

### 3. Run Development

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

App runs at: **http://localhost:5173**
API runs at: **http://localhost:5000**

---

## 📁 Project Structure

```
MLH-hackathon/
├── client/                          # React + Vite Frontend
│   └── src/
│       ├── components/              # Reusable UI components
│       │   ├── AIChat.jsx           # AI chat interface with voice input
│       │   ├── InvoicePreview.jsx   # Invoice review & confirmation
│       │   ├── ProductSelector.jsx  # Searchable product picker
│       │   ├── CustomerSelector.jsx # Customer search
│       │   └── ...
│       ├── pages/                   # Full page components
│       │   ├── Dashboard.jsx        # Business overview & charts
│       │   ├── Billing.jsx          # Create bills & send to WhatsApp
│       │   ├── AIChatPage.jsx       # AI assistant with quick actions
│       │   ├── Products.jsx         # Product catalog management
│       │   ├── Customers.jsx        # Customer list & profiles
│       │   ├── Inventory.jsx        # Stock management & purchases
│       │   ├── Khata.jsx            # Digital credit ledger
│       │   └── Reports.jsx          # Analytics & GST reports
│       ├── services/
│       │   └── api.js               # Axios API client
│       └── styles/                  # Pure CSS3 stylesheets
│
└── server/                          # Express Backend
    └── src/
        ├── models/                  # Mongoose schemas
        │   ├── User.js, Shop.js
        │   ├── Product.js, Customer.js
        │   ├── Invoice.js, Sale.js
        │   ├── Purchase.js, Payment.js
        │   ├── Expense.js, StockMovement.js
        │   └── WhatsAppMessage.js, AIActionLog.js
        ├── services/                # Business logic
        │   ├── groqService.js       # AI with tool-calling
        │   ├── billingService.js    # Invoice creation & confirmation
        │   ├── inventoryService.js  # Stock management
        │   ├── ledgerService.js     # Customer Khata
        │   ├── reportService.js     # Analytics
        │   ├── invoiceService.js    # PDF generation
        │   └── whatsappService.js   # WhatsApp Cloud API
        ├── controllers/             # Request handlers
        ├── routes/                  # API route definitions
        ├── middleware/              # Auth, validation, errors
        └── validators/              # Zod schemas
```

---

## 🤖 AI Workflow Example

```
Shopkeeper types: "Ramesh ko 2 kilo chawal aur 1 kilo chini bechi. Bill WhatsApp par bhej dena."

1. Groq extracts intent: create_sale, customer: Ramesh, items: [chawal 2kg, chini 1kg]
2. Backend resolves product IDs & prices from database
3. Invoice draft created with GST calculations
4. Shopkeeper reviews & confirms
5. MongoDB records sale, stock deducted atomically
6. PDF generated and sent to Ramesh's WhatsApp
```

**Available AI Tools:**
- `search_products` — Find products by name/Hindi alias
- `search_customers` — Resolve customer from name/phone
- `get_inventory` — Check stock levels
- `prepare_sale_draft` — Build invoice draft
- `get_customer_ledger` — View credit/payment history
- `get_sales_report` — Today's/weekly/monthly sales
- `record_expense` — Log shop expenses
- `suggest_reorder` — AI reorder recommendations

---

## 🔒 Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT authentication on all private routes
- Shop isolation — every record scoped to authenticated shop
- Helmet HTTP security headers
- Rate limiting (100 req/15min global, 10 req/15min on auth)
- AI output validated before any database mutation
- WhatsApp recipient verified before sending
- No customer data sent to Groq unnecessarily

---

## 📱 WhatsApp Integration

To enable WhatsApp invoice sending:
1. Create a Meta Developer App at [developers.facebook.com](https://developers.facebook.com)
2. Set up WhatsApp Business Cloud API
3. Add credentials to `.env`
4. Set webhook URL: `https://your-domain.com/api/webhooks/whatsapp`

For testing without WhatsApp credentials, the app works fully — invoices are saved as PDFs and the WhatsApp send step is skipped.

---

## 🌐 Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel (`npm run build` → deploy `dist/`) |
| Backend | Render (Web Service, Node.js) |
| Database | MongoDB Atlas (free M0 cluster) |

Set all environment variables in your deployment platform's dashboard.

---

## 📊 Database Collections

| Collection | Purpose |
|---|---|
| `users` | Authentication |
| `shops` | Shop profiles, invoice counters |
| `products` | Catalog with GST, stock levels |
| `customers` | Contacts, WhatsApp consent, balances |
| `invoices` | Bills with item snapshots |
| `sales` | Completed sale records |
| `purchases` | Supplier stock-in records |
| `payments` | Cash/UPI payments received |
| `expenses` | Overhead expenses |
| `stockmovements` | Full stock audit trail |
| `whatsappmessages` | Delivery receipts |
| `aiactionlogs` | AI query audit trail |

---

## 🎯 Hackathon Demo Flow

1. **Register** as a new shopkeeper → set up shop profile
2. **Add products** → Chawal (₹45/kg), Chini (₹50/kg), Dal (₹120/kg)
3. **Add customer** → Ramesh, 9876543210
4. **Open AI Assistant** → type "Ramesh ko 2 kilo chawal bechi"
5. **Review draft invoice** → confirm
6. **Send WhatsApp** invoice to Ramesh
7. **Check Dashboard** → see today's sales updated
8. **View Inventory** → chawal stock reduced by 2
9. **Reports tab** → see GST summary

---
local commerce.

---

**Dukaan Sahayak — Empowering small businesses through technology.**

*Built with ❤️ for local shopkeepers and entrepreneurs.*
>>>>>>> a1676746ccf933571a1d73811e145212379edf0b
