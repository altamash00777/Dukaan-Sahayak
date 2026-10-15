# 🏪 Dukaan Sahayak

**An AI-powered digital assistant for small businesses.**

Dukaan Sahayak is designed to help small shopkeepers, local vendors, and business owners manage their daily operations digitally. It combines AI-powered assistance with customer management, digital khata, payment tracking, inventory management, and WhatsApp communication to make business management easier and more efficient.

## ✨ Key Features

- 🤖 **AI-Powered Assistant:** Uses the Gemma 4 model to understand shopkeeper queries and assist with routine business tasks.
- 👥 **Customer Management:** Add, view, and manage customer details in one place.
- 📒 **Digital Khata:** Maintain customer balances, outstanding dues, and payment records.
- 💬 **WhatsApp Integration:** Integrate Twilio to send payment reminders and business notifications.
- 📦 **Inventory Management:** Track products, available stock, and sales records.
- 📊 **Business Insights:** View summaries of sales, payments, and pending dues.
- 🔐 **Secure Authentication:** Use JWT-based authentication and bcrypt password hashing.
- 🎨 **Simple User Interface:** Build an intuitive, responsive interface using React.js and CSS3.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js + Vite | Frontend development |
| CSS3 | Styling and responsive UI |
| Node.js + Express.js | Backend and REST APIs |
| MongoDB + Mongoose | Database and data modelling |
| Gemma 4 API | AI-powered assistance |
| Twilio WhatsApp API | WhatsApp messaging |
| JWT + bcrypt | Authentication and password security |

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone <(https://github.com/altamash00777/Dukaan-Sahayak)>
cd dukaan-sahayak
```

### 2. Install dependencies

Install dependencies in both the frontend and backend directories:

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the backend directory and add your configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMMA_API_KEY=your_gemma_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=your_whatsapp_sender
```

Replace the placeholders with your actual credentials. Keep API keys and secrets private.

### 4. Run the application

Start the backend using the script configured in your backend `package.json`:

```bash
npm run dev
```

In a separate terminal, navigate to the frontend directory and run:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🔄 How It Works

1. The shopkeeper interacts with the React frontend.
2. The backend processes requests and communicates with MongoDB.
3. The AI integration helps interpret supported business queries.
4. The application manages customer records, balances, and business data.
5. Twilio can deliver WhatsApp messages when its integration is configured.

Financial updates should be validated by the backend and confirmed by the shopkeeper before being saved.

## 🚀 Future Enhancements

- Voice-based commands in Hindi and other regional languages.
- AI-assisted sales and inventory insights.
- Digital invoice generation and sharing.
- Improved multilingual support.
- Additional business reports and analytics.

## 🎯 Our Mission

To make digital tools more accessible to small businesses by simplifying everyday record-keeping, improving payment tracking, and bringing AI assistance into local commerce.

---

**Dukaan Sahayak — Empowering small businesses through technology.**

*Built with ❤️ for local shopkeepers and entrepreneurs.*
