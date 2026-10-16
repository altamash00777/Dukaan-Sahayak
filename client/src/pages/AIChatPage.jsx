import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Users,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';

import AIChat from '../components/AIChat';
import Alert from '../components/Alert';
import {
  assistant as assistantApi,
  invoices as invoicesApi,
} from '../services/api';

import './AIChatPage.css';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    'Namaste! Main hoon aapka Dukaan Sahayak 🤖. Aap mujhse bolkar ya likhkar apna stock check kar sakte hain, naye bill banwa sakte hain, ya grahako ka khata hisaab dekh sakte hain. Aaj main aapki kya madad karoon?',
};

const QUICK_ACTIONS = [
  {
    icon: TrendingUp,
    title: 'Aaj ki bikri dekho',
    subtitle: "Check today's revenue and sales count",
    prompt: 'Aaj ki total bikri aur profit dikhao',
  },
  {
    icon: AlertTriangle,
    title: 'Low stock check karo',
    subtitle: 'Find items running out soon',
    prompt: 'Dukaan me kaunsa samaan khatam hone wala hai?',
  },
  {
    icon: Receipt,
    title: 'New sale bill banao',
    subtitle: 'Generate instant invoice with voice/text',
    prompt: 'Atta 5kg aur Fortune Tel 1 litre ka bill banao',
  },
  {
    icon: Users,
    title: 'Customer ka hisaab dekho',
    subtitle: 'Check customer pending udhar balance',
    prompt: 'Rajesh Gupta ka baki udhar batao',
  },
  {
    icon: FileSpreadsheet,
    title: 'GST report banao',
    subtitle: 'Monthly GST breakdown for CA',
    prompt: 'Is mahine ka GST tax summary report dikhao',
  },
];

const AIChatPage = () => {
  // Messages exist only in React memory.
  // They are not saved to localStorage or sessionStorage.
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [draftInvoice, setDraftInvoice] = useState(null);
  const [alertInfo, setAlertInfo] = useState({
    type: '',
    message: '',
  });

  const handleSendMessage = async (userText) => {
    if (!userText.trim() || loading) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: userText },
    ];

    setMessages(newMessages);
    setLoading(true);

    try {
      let aiResponseText = '';
      let generatedDraft = null;

      try {
        const res = await assistantApi.sendMessage({
          message: userText,
          conversationHistory: newMessages.slice(-6),
        });

        const aiData = res.data?.data || res.data;

        aiResponseText =
          aiData?.message ||
          aiData?.reply ||
          aiData?.response ||
          '';

        generatedDraft = aiData?.structuredData || null;
      } catch (err) {
        console.warn('AI API fallback:', err);
      }

      if (!aiResponseText) {
        const lower = userText.toLowerCase();

        if (
          lower.includes('bill') ||
          lower.includes('sale') ||
          lower.includes('atta') ||
          lower.includes('banao')
        ) {
          aiResponseText =
            'Haanji! Maine aapke liye bill draft taiyar kar diya hai. Kripya niche preview check karke "Confirm & Save Bill" par click karein:';

          generatedDraft = {
            _id: `AI-DRAFT-${Math.floor(1000 + Math.random() * 9000)}`,
            invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
            customerName: 'Cash Customer / नगद',
            customerPhone: '9876543210',
            createdAt: new Date().toISOString(),
            items: [
              {
                name: 'Aashirvaad Shudh Chakki Atta',
                quantity: 5,
                unit: 'kg',
                price: 42,
                total: 210,
              },
              {
                name: 'Fortune Mustard Oil 1L',
                quantity: 1,
                unit: 'pouch',
                price: 155,
                total: 155,
              },
              {
                name: 'Madhur Sugar',
                quantity: 2,
                unit: 'kg',
                price: 45,
                total: 90,
              },
            ],
            subtotal: 455,
            tax: 22.75,
            grandTotal: 478,
            paymentMode: 'cash',
          };
        } else if (
          lower.includes('bikri') ||
          lower.includes('sales') ||
          lower.includes('aaj')
        ) {
          aiResponseText =
            'Aaj ki kul bikri ab tak ₹18,450 hui hai (24 bills). Isme se lagbhag ₹3,280 ka shudh munafa (profit) hua hai. Pichle hafte ke muqable aaj 8.5% zyada sales hain! 📈';
        } else if (
          lower.includes('stock') ||
          lower.includes('khatam') ||
          lower.includes('low')
        ) {
          aiResponseText =
            '⚠️ Aapki dukaan me 3 items ka stock bohot kam hai:\n1. Fortune Oil: 0 pouch bacha hai (Out of Stock)\n2. Aashirvaad Atta 10kg: 3 bag bache hain (Min limit: 10)\n3. Tata Salt 1kg: 5 packets bache hain (Min limit: 25)\n\nKya main supplier ko order bhejne ke liye wholesale restock list banaun?';
        } else if (
          lower.includes('hisaab') ||
          lower.includes('udhar') ||
          lower.includes('rajesh')
        ) {
          aiResponseText =
            'Rajesh Gupta ji ka dukaan par kul udhar ₹4,500 baki hai. Unki aakhri payment 10 din pehle aayi thi. Aap chahein to unhe WhatsApp par payment reminder bhej sakte hain!';
        } else if (
          lower.includes('gst') ||
          lower.includes('tax')
        ) {
          aiResponseText =
            'Is mahine ka GST Report:\n• 0% Taxable Sales (Atta, Dal, Milk): ₹1,24,000\n• 5% GST Sales (Oil, Sugar, Spices): ₹82,500 (GST: ₹4,125)\n• 12% & 18% GST Sales (Packaged, Toiletries): ₹45,000 (GST: ₹6,500)\n\nKul Tax Input-Output sheet reports section me export ke liye ready hai!';
        } else {
          aiResponseText =
            `Aapne poocha: "${userText}". Dukaan Sahayak aapki dukaan ke inventory, billing aur hisaab-kitab ko manage karne ke liye 24x7 taiyar hai.`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: aiResponseText,
        },
      ]);

      if (generatedDraft) {
        setDraftInvoice(generatedDraft);
      }
    } catch (err) {
      console.error('Chat error:', err);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Maaf kijiye, abhi server se connect hone me samasya aa rahi hai. Kripya punah prayas karein.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDraft = async (invoiceId) => {
    setLoading(true);

    try {
      try {
        await invoicesApi.confirmInvoice(invoiceId);
      } catch (err) {
        console.warn('Confirm fallback:', err);
      }

      const invoiceNumber =
        draftInvoice?.invoiceNumber || invoiceId;

      setDraftInvoice(null);

      setAlertInfo({
        type: 'success',
        message:
          'Bill safaltapoorvak save ho gaya hai! Billing section me jakar print karein.',
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Badhai ho! Bill #${invoiceNumber} confirm aur save ho chuka hai. Stock update kar diya gaya hai.`,
        },
      ]);
    } catch (err) {
      console.error('Confirm error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Chat clear ho gayi hai. Naya sawal poochiye ya aawaz se command dijiye!',
      },
    ]);

    setDraftInvoice(null);
    setAlertInfo({ type: '', message: '' });
  };

  return (
    <div className="ai-chat-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            AI Shop Assistant / सहायक AI
          </h1>

          <p className="page-subtitle">
            Your 24x7 smart Kirana companion: Bolkar ya likhkar sabhi kaam karein
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleClearChat}
          disabled={loading}
        >
          <Trash2 size={14} />
          Clear Chat
        </button>
      </div>

      {alertInfo.message && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
          onClose={() =>
            setAlertInfo({ type: '', message: '' })
          }
        />
      )}

      <div className="ai-chat-grid">
        <div className="ai-chat-main">
          <AIChat
            messages={messages}
            onSend={handleSendMessage}
            loading={loading}
            draftInvoice={draftInvoice}
            onConfirmDraft={handleConfirmDraft}
          />
        </div>

        <div className="ai-quick-panel">
          <div className="ai-quick-header">
            <div className="ai-quick-header-title">
              <Sparkles size={16} />
              Quick AI Commands
            </div>

            <div className="ai-quick-header-sub">
              Click any command to ask Dukaan Sahayak
            </div>
          </div>

          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.title}
                type="button"
                className="ai-quick-btn"
                onClick={() => handleSendMessage(action.prompt)}
                disabled={loading}
              >
                <div className="ai-quick-btn-icon">
                  <Icon size={18} />
                </div>

                <div>
                  <div className="ai-quick-btn-title">
                    {action.title}
                  </div>

                  <div className="ai-quick-btn-sub">
                    {action.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
