import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, User, Sparkles } from 'lucide-react';
import InvoicePreview from './InvoicePreview';

const SUGGESTIONS = [
  'आज की बिक्री दिखाओ',
  'Stock check karo',
  'New sale banao',
  'Low stock items batao',
  'Ramesh ka hisaab dikhao',
  'Atta 5kg aur Cheeni 2kg ka bill banao',
];

const AIChat = ({
  messages = [],
  onSend,
  loading = false,
  draftInvoice = null,
  onConfirmDraft,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, draftInvoice]);

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN'; // hindi / hinglish friendly

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech start error:', err);
      }
    }
  };

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Suggestions header */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#fafbfc',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <Sparkles size={16} color="var(--secondary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          QUICK ACTIONS:
        </span>
        {SUGGESTIONS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip)}
            disabled={loading}
            style={{
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'var(--transition)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-light)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: '#f8fafc',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              maxWidth: '400px',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: 'var(--primary)',
              }}
            >
              <Bot size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Namaste! Main hoon aapka Dukaan Sahayak 🤖
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              Aap mujhse bolkar ya likhkar sale bana sakte hain, stock check kar sakte hain, ya customer ka khata dekh sakte hain.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user' || msg.sender === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={18} />
                </div>
              )}

              <div
                style={{
                  maxWidth: '80%',
                  padding: '0.85rem 1.15rem',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  backgroundColor: isUser ? 'var(--primary)' : '#ffffff',
                  color: isUser ? '#ffffff' : 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                  border: isUser ? 'none' : '1px solid var(--border)',
                  lineHeight: '1.5',
                  fontSize: '0.95rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content || msg.text}
              </div>

              {isUser && (
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: 'var(--secondary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {/* Inline draft invoice */}
        {draftInvoice && (
          <div
            style={{
              margin: '1rem 0',
              border: '2px solid var(--primary)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Sparkles size={16} /> AI Generated Draft Invoice
            </div>
            <InvoicePreview
              invoice={draftInvoice}
              onConfirm={onConfirmDraft}
              loading={loading}
            />
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} />
            </div>
            <div
              style={{
                padding: '0.6rem 1rem',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: 'var(--primary)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 1s infinite alternate',
                }}
              />
              <span
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: 'var(--primary)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 1s infinite alternate 0.2s',
                }}
              />
              <span
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: 'var(--primary)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 1s infinite alternate 0.4s',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                Sahayak sooch raha hai...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#ffffff',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <button
          type="button"
          onClick={toggleListening}
          style={{
            padding: '0.65rem',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isListening ? 'var(--danger)' : 'var(--bg-hover)',
            color: isListening ? '#ffffff' : 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'var(--transition)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isListening ? 'Stop listening' : 'Speak in Hindi/English'}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <input
          type="text"
          className="form-input"
          style={{ flex: 1, borderRadius: 'var(--radius-full)' }}
          placeholder={isListening ? 'Sun raha hoon, boliye...' : 'Kuch bhi puchiye ya bill banwaiye...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <button
          type="button"
          className="btn btn-primary"
          style={{ borderRadius: 'var(--radius-full)', padding: '0.65rem 1.25rem' }}
          onClick={() => handleSend()}
          disabled={loading || !inputText.trim()}
        >
          <Send size={18} />
          <span>Bhejo</span>
        </button>
      </div>
    </div>
  );
};

export default AIChat;
