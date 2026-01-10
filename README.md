# GoStudy! 🚀

**Transform your study materials into AI-powered learning experiences.**

GoStudy! is an intelligent learning platform that converts static notes, PDFs, and documents into science-backed study plans featuring active recall quizzes, memory palaces, and spaced repetition schedules.

[![Made with Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## ✨ Features

### 🧠 AI-Powered Study Plans
- **Smart Summaries**: Distilled key concepts with highlighted terms
- **Visual Concept Maps**: Hierarchical topic trees for better understanding
- **Active Recall Quizzes**: AI-generated questions with difficulty ratings (1-5 stars)
- **Spaced Repetition**: Science-backed review schedules (Day 1, 3, 7, 14)
- **Memory Palace**: Spatial mnemonics for complex information retention

### 📚 Multi-Format Support
- PDF documents
- Microsoft Word (.docx)
- Plain text files (.txt)
- Up to 5MB per file

### 💳 Flexible Pricing
- **Free Plan**: 3 lifetime uploads
- **Pro Plan**: 40 uploads/month @ $12.99
- **Institution Plan**: Custom enterprise solutions

### 🔐 Secure & Reliable
- Firebase Authentication (Google + Email/Password)
- PayPal subscription integration with webhook verification
- Production-safe credits system with atomic transactions
- Complete audit trail via credits ledger

### 📱 User-Friendly Interface
- Clean, Apple-inspired design
- Real-time credit balance tracking
- Study plan history and editing
- Profile customization
- AI chat assistant (Nova)

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, Vanilla JavaScript (ES Modules), Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **AI Engine** | Perplexity AI (`sonar` model) |
| **Authentication** | Firebase Auth |
| **Database** | Google Cloud Firestore |
| **Payments** | PayPal Subscriptions API |
| **File Processing** | Multer, pdf-parse, Mammoth |
| **Hosting** | Vercel (Frontend), Render (Backend) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase project with Firestore enabled
- Perplexity AI API key
- PayPal Business account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/gostudy.git
cd gostudy
```

2. **Install dependencies**
```bash
cd backend
npm install
```

3. **Configure environment variables**

Create a `.env` file in the `backend/` directory:

```env
# AI Configuration
PERPLEXITY_API_KEY=your_perplexity_api_key

# Firebase Admin SDK (JSON as string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Firebase Web Config (for client)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id

# Environment
NODE_ENV=development
PORT=3000
```

4. **Start the backend server**
```bash
npm start
```

5. **Open the frontend**

For local development, use a static file server:
```bash
npx serve . -p 8080
```

Or deploy to Vercel:
```bash
vercel deploy
```

---

## 📖 Usage

### For Students

1. **Sign Up**: Create a free account via email or Google
2. **Upload Materials**: Drop your lecture notes, textbooks, or study guides
3. **Generate Plan**: AI analyzes your content and creates a personalized study plan
4. **Study Smart**: Use active recall quizzes and spaced repetition schedules
5. **Track Progress**: Monitor your credits and study history

### For Developers

**Generate a study plan via API:**

```javascript
const formData = new FormData();
formData.append('document', fileInput.files[0]);
formData.append('difficulty', 'University');

const response = await fetch('https://api.gostudy.com/api/generate-plan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseIdToken}`
  },
  body: formData
});

const studyPlan = await response.json();
console.log(studyPlan.summary);
console.log(studyPlan.active_recall); // Quiz questions
console.log(studyPlan.concept_map);   // Topic hierarchy
```

---

## 🏗️ Architecture

### Authentication Flow
```
Client → Firebase Auth → ID Token → Backend Middleware → Protected Route
```

### Credits System Flow
```
User Action → checkCredits() → Firestore Transaction → deductCredits() 
→ Ledger Entry → Response
```

### PayPal Webhook Flow
```
PayPal Event → Signature Verification → Idempotency Check 
→ Credits Transaction → Webhook Logged
```

### AI Generation Pipeline
```
File Upload → Text Extraction → Perplexity AI → JSON Validation 
→ Firestore Storage → Credits Deduction
```

---

## 📁 Project Structure

```
gostudy/
├── backend/
│   ├── server.js              # Express API server
│   ├── limits.js              # Upload limit logic
│   ├── js/auth.js             # Client-side auth module
│   └── saved_plans/           # Generated plans (disk backup)
├── dashboard/                 # Main app interface
├── edit-plan/                 # Study plan editor
├── pricing/                   # Subscription plans
│   └── pro/                   # PayPal checkout
├── profile/                   # Account settings
├── ai-chat/                   # AI assistant interface
├── articles/                  # Blog content
├── methodology/               # Learning science info
├── onboarding/                # New user flow
├── assets/                    # Images, fonts, styles
└── index.html                 # Landing page
```

---

## 🧪 Testing

Run backend unit tests:
```bash
cd backend
npm test
```

Test files:
- `limits.test.js` - Upload limit validation
- `paypal.test.js` - PayPal webhook integration

---

## 🔒 Security

- **Firebase ID Token Verification**: All authenticated routes protected
- **PayPal Webhook Signatures**: Prevents spoofed payment events
- **Idempotency Keys**: Prevents duplicate transactions
- **Atomic Firestore Transactions**: Prevents race conditions
- **Credits Ledger**: Complete audit trail for compliance
- **Input Validation**: Zod schema validation for AI responses

---

## 🌟 Key Differentiators

| Feature | GoStudy! | Standard AI Tools |
|---------|----------|-------------------|
| **Cognitive Load Analysis** | ✅ | ❌ |
| **Memory Palace Generation** | ✅ | ❌ |
| **Spaced Repetition Engine** | ✅ | ⚠️ Basic |
| **Visual Concept Maps** | ✅ | ❌ |
| **Production Credits System** | ✅ | ❌ |
| **Multi-Format Support** | ✅ | ⚠️ Limited |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style (ES6+, async/await)
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Perplexity AI** - Powering our study plan generation
- **Firebase** - Authentication and database infrastructure
- **PayPal** - Secure payment processing
- **Tailwind CSS** - Beautiful, responsive UI components
- **The Open Source Community** - For amazing tools and libraries

---

## 📞 Contact & Support

- **Website**: [gostudy.ai](https://gostudy.ai)
- **Email**: support@gostudy.ai
- **Discord**: [Join our community](https://discord.gg/gostudy)
- **Twitter**: [@GoStudyAI](https://twitter.com/GoStudyAI)

### For Bug Reports
Please open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser/OS information

---

## 🗺️ Roadmap

- [ ] Mobile app (iOS & Android)
- [ ] OCR support for handwritten notes
- [ ] Collaborative study groups
- [ ] Anki/Quizlet export integration
- [ ] 3D Memory Palace visualization
- [ ] Multi-language support
- [ ] Teacher dashboard for institutions
- [ ] API for third-party integrations

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/project-gostudy/gostudy?style=social)
![GitHub forks](https://img.shields.io/github/forks/project-gostudy/gostudy?style=social)
![GitHub issues](https://img.shields.io/github/issues/project-gostudy/gostudy)
![GitHub last commit](https://img.shields.io/github/last-commit/project-gostudy/gostudy)

---

<div align="center">
  <strong>Built with ❤️ for students worldwide</strong>
  <br>
  <sub>© 2025 GoStudy Inc. All rights reserved.</sub>
</div>
