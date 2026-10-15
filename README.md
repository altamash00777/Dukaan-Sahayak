# 🏪 Dukaan Sahayak

**An AI-powered digital assistant for small businesses.**

Dukaan Sahayak helps shopkeepers manage customers, track pending payments, maintain digital khata records, and simplify daily business activities using AI and WhatsApp integration.

## ✨ Key Features

- 🤖 **AI Assistant:** Uses Gemma 4 to understand shopkeeper queries and assist with business tasks.
- 👥 **Customer Management:** Add and manage customer details.
- 📒 **Digital Khata:** Track outstanding balances and payment history.
- 💬 **WhatsApp Integration:** Send payment reminders using Twilio.
- 📦 **Inventory Management:** Manage product stock and sales records.
- 📊 **Business Insights:** View useful summaries of business activities.
- 🌐 **Simple Interface:** Responsive React UI with CSS3 styling.

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **AI:** Gemma 4 API
- **Messaging:** Twilio WhatsApp API
- **Authentication:** JWT, bcrypt

## ⚙️ Getting Started

**1. Clone the repository**
```bash
git clone <https://github.com/altamash00777/Dukaan-Sahayak>
cd dukaan-sahayak
```

**2. Install dependencies**

Run in both the frontend and backend directories:
```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMMA_API_KEY=your_gemma_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=your_whatsapp_sender
```

**4. Start the application**

Run the backend:
```bash
npm run dev
```

Run the frontend in a separate terminal:
```bash
npm run dev
```

## 🎯 Our Goal

To make digital business management simpler and more accessible for small shopkeepers through AI-powered assistance, easy payment tracking, and WhatsApp communication.

---

*Built with ❤️ to empower small businesses.*
