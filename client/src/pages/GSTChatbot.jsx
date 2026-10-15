import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle, Send, Bot, User, FileText, Download,
  TrendingUp, IndianRupee, RefreshCw, Mic, MicOff, Sparkles,
} from 'lucide-react';
import { assistant as assistantApi, reports as reportsApi } from '../services/api';

/* ─── Sample GST data (used when API not available) ─────────────────── */
const SAMPLE_GST = {
  month: 'October 2026',
  totalSales: 189700,
  taxableSales: 95300,
  exemptSales: 94400,
  slabs: [
    { rate: '0%',  label: 'Exempt (Rice, Atta, Salt)',    taxable: 94400, cgst: 0,    sgst: 0,    total: 0    },
    { rate: '5%',  label: 'Kirana Basics (Tea, Spices)',  taxable: 52400, cgst: 1310, sgst: 1310, total: 2620 },
    { rate: '12%', label: 'Packaged Food (Ghee, Pickle)', taxable: 18600, cgst: 1116, sgst: 1116, total: 2232 },
    { rate: '18%', label: 'Home Care (Soap, Shampoo)',    taxable: 24300, cgst: 2187, sgst: 2187, total: 4374 },
  ],
  totalCgst: 4613,
  totalSgst: 4613,
  totalGst: 9226,
  netPayable: 9226,
};

/* ─── Quick question chips ───────────────────────────────────────────── */
const QUICK_QUESTIONS = [
  { label: '📊 GST summary dikhao',          q: 'Is mahine ka GST summary dikhao' },
  { label: '🧾 Kitna GST bharna hai?',       q: 'Is mahine kitna GST bharna hai government ko?' },
  { label: '📦 Kaunsa product 0% GST hai?',  q: 'Mere shop mein kaunse products 0% GST mein aate hain?' },
  { label: '💰 CGST vs SGST kya hai?',       q: 'CGST aur SGST mein kya fark hai? Simple batao.' },
  { label: '📅 GST file kab karni hai?',     q: 'GST return kab file karni padti hai? Deadline kya hai?' },
  { label: '🔍 18% wale products kaunse?',   q: 'Mere shop mein 18% GST wale products kaunse hain?' },
];

/* ─── GST Slab colour map ────────────────────────────────────────────── */
const SLAB_COLOR = { '0%': '#10b981', '5%': '#2563eb', '12%': '#f59e0b', '18%': '#ef4444', '28%': '#8b5cf6' };

/* ═══════════════════════════════════════════════════════════════════════ */
const GSTChatbot = () => {
  /* chat state */
  const [messages,  setMessages]  = useState([
    {
      id: 1, role: 'assistant',
      text: `Namaste! 🙏 Main aapka **GST Sahayak** hoon — Dukaan Sahayak ka GST expert.\n\nMain aapki help kar sakta hoon:\n• 📊 GST report dekhna\n• 🧾 Monthly GST calculation\n• 📦 Product GST rates jaanna\n• 💡 GST filing guidance\n\nKuch puchna hai? Neche quick questions use kar sakte hain ya apna sawaal type karein! 👇`,
      ts: new Date(),
    },
  ]);
  const [input,     setInput]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [listening, setListening] = useState(false);

  /* GST data state */
  const [gstData,   setGstData]   = useState(SAMPLE_GST);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeMonth, setActiveMonth] = useState('2026-10');

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const recognRef  = useRef(null);

  /* auto-scroll */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* load GST data from API */
  const loadGstData = useCallback(async (month) => {
    setDataLoading(true);
    try {
      const [year, mon] = month.split('-');
      const res  = await reportsApi.getMonthly(year, mon);
      const data = res.data?.data;
      if (data?.gst) setGstData(data.gst);
    } catch {
      /* keep sample data */
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { loadGstData(activeMonth); }, [activeMonth, loadGstData]);

  /* build context string for AI */
  const buildGstContext = () => {
    const s = gstData;
    return `
GST Report Data for ${s.month}:
- Total Sales: ₹${s.totalSales?.toLocaleString('en-IN')}
- Total GST Collected: ₹${s.totalGst?.toLocaleString('en-IN')}
- Net GST Payable to Govt: ₹${s.netPayable?.toLocaleString('en-IN')}
- CGST: ₹${s.totalCgst?.toLocaleString('en-IN')} | SGST: ₹${s.totalSgst?.toLocaleString('en-IN')}

GST Slab Breakdown:
${s.slabs?.map(sl => `  ${sl.rate} slab (${sl.label}): Taxable ₹${sl.taxable?.toLocaleString('en-IN')}, GST ₹${sl.total?.toLocaleString('en-IN')}`).join('\n')}

Filing Deadlines:
- GSTR-1: 11th of next month
- GSTR-3B: 20th of next month (or 22nd/24th for small taxpayers)
    `.trim();
  };

  /* send message */
  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || sending) return;

    const userMsg = { id: Date.now(), role: 'user', text: q, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const gstContext = buildGstContext();
      const systemNote = `\n\nCurrent GST Report Context:\n${gstContext}\n\nAnswer in the same language the user used. Be concise, use ₹ for amounts, and focus on GST topics.`;

      const res = await assistantApi.sendMessage({
        message:             q,
        conversationHistory: messages.slice(-6).map(m => ({ role: m.role, content: m.text })),
        systemNote,
        context: 'gst_report',
      });

      const reply = res.data?.data?.message || res.data?.message || 'Maafi! Kuch technical error aa gayi. Dobara try karein.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply, ts: new Date() }]);
    } catch (err) {
      /* smart offline fallback answers */
      const lower = q.toLowerCase();
      let fallback = '';

      if (lower.includes('kitna') || lower.includes('payable') || lower.includes('bharna')) {
        fallback = `Is mahine aapko **₹${gstData.netPayable?.toLocaleString('en-IN')}** GST bharna hai government ko.\n\n• CGST: ₹${gstData.totalCgst?.toLocaleString('en-IN')}\n• SGST: ₹${gstData.totalSgst?.toLocaleString('en-IN')}\n\n📅 GSTR-3B deadline: 20 November 2026`;
      } else if (lower.includes('summary') || lower.includes('report')) {
        fallback = `**GST Summary — ${gstData.month}** 📊\n\n💰 Total Sales: ₹${gstData.totalSales?.toLocaleString('en-IN')}\n🧾 Total GST: ₹${gstData.totalGst?.toLocaleString('en-IN')}\n\n**Slab-wise:**\n${gstData.slabs?.map(s => `• ${s.rate} — ₹${s.total?.toLocaleString('en-IN')}`).join('\n')}`;
      } else if (lower.includes('0%') || lower.includes('exempt') || lower.includes('zero')) {
        fallback = `**0% GST Products (Tax-Free):**\n\n• Chawal (Rice), Gehun (Wheat), Aata\n• Namak (Salt), Cheeni (Sugar)\n• Taza Doodh (Fresh Milk)\n• Taza Sabzi & Phal (Fresh vegetables & fruits)\n• Anda (Eggs)\n\n✅ In products pe koi GST nahi lagta!`;
      } else if (lower.includes('cgst') || lower.includes('sgst') || lower.includes('fark')) {
        fallback = `**CGST vs SGST:**\n\n🏛️ **CGST** (Central GST) — Central Government ko jata hai\n🏢 **SGST** (State GST) — Aapki State Government ko jata hai\n\nDono equal hote hain! Agar rate 18% hai:\n• CGST = 9% (Centre)\n• SGST = 9% (State)\n• Total = 18%\n\n💡 IGST tab lagta hai jab aap doosre state mein sell karte ho.`;
      } else if (lower.includes('deadline') || lower.includes('file') || lower.includes('kab')) {
        fallback = `**GST Filing Deadlines:**\n\n📋 **GSTR-1** (Sales data)\n→ Monthly: 11th of next month\n→ Quarterly: Last day of next quarter\n\n📊 **GSTR-3B** (Payment summary)\n→ Regular: 20th of next month\n→ Small taxpayers: 22nd/24th\n\n⚠️ Late filing = ₹50/day penalty minimum!\n\n✅ Dukaan Sahayak ki Reports page se data ready milta hai!`;
      } else {
        fallback = `Aapka sawaal note kar liya! GST ke baare mein:\n\n• Is mahine ka total GST: **₹${gstData.totalGst?.toLocaleString('en-IN')}**\n• GSTR-3B deadline: 20th November 2026\n\nAI temporarily offline hai. Reports page mein full GST data dekh sakte hain! 📊`;
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        text: fallback, ts: new Date(), offline: true,
      }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  /* voice input */
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser.');
      return;
    }
    if (listening) {
      recognRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r   = new SR();
    r.lang = 'hi-IN';
    r.interimResults = false;
    r.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    r.onerror  = ()  => setListening(false);
    r.onend    = ()  => setListening(false);
    recognRef.current = r;
    r.start();
    setListening(true);
  };

  /* render message text (bold **...**) */
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : p.split('\n').map((line, j) => <span key={`${i}-${j}`}>{line}{j < p.split('\n').length - 1 && <br />}</span>)
    );
  };

  /* ── totals ── */
  const totalGst = gstData.slabs?.reduce((s, sl) => s + (sl.total || 0), 0) || gstData.totalGst || 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">GST Report + AI Chatbot 🧾</h1>
          <p className="page-subtitle">GST data dekhein aur AI se sawaal poochein — Hindi/Hinglish mein</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
          color: '#fff', borderRadius: 'var(--radius)', padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}>
          <Sparkles size={14} /> Gemma 4 AI Powered
        </div>
      </div>

      {/* Month picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>📅 Report Month:</label>
        <input
          type="month"
          className="form-input"
          style={{ width: 180, height: 38 }}
          value={activeMonth}
          onChange={(e) => setActiveMonth(e.target.value)}
        />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => loadGstData(activeMonth)}>
          <RefreshCw size={14} /> Refresh
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
          <Download size={14} /> Export / Print
        </button>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: GST Data Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.85rem' }}>
            {[
              { label: 'Total Sales',       value: `₹${gstData.totalSales?.toLocaleString('en-IN')}`,  icon: TrendingUp,    color: '#2563eb' },
              { label: 'GST Collected',     value: `₹${totalGst?.toLocaleString('en-IN')}`,            icon: FileText,      color: '#7c3aed' },
              { label: 'CGST Payable',      value: `₹${gstData.totalCgst?.toLocaleString('en-IN')}`,   icon: IndianRupee,   color: '#ef4444' },
              { label: 'SGST Payable',      value: `₹${gstData.totalSgst?.toLocaleString('en-IN')}`,   icon: IndianRupee,   color: '#f59e0b' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '1rem',
                borderTop: `3px solid ${color}`, boxShadow: 'var(--shadow)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={color} />
                  </div>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color, marginTop: 6 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* GST Net Payable Banner */}
          <div style={{
            background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff',
            borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Net GST Payable to Government
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: 4 }}>
                ₹{totalGst?.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 2 }}>
                GSTR-3B Deadline: 20th of next month
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Split:</div>
              <div style={{ fontWeight: 700 }}>CGST: ₹{gstData.totalCgst?.toLocaleString('en-IN')}</div>
              <div style={{ fontWeight: 700 }}>SGST: ₹{gstData.totalSgst?.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Slab-wise breakdown table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={17} color="var(--primary)" /> GST Slab-wise Breakdown — {gstData.month}
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>GST Rate</th>
                    <th>Product Category</th>
                    <th style={{ textAlign: 'right' }}>Taxable Sales (₹)</th>
                    <th style={{ textAlign: 'right' }}>CGST (₹)</th>
                    <th style={{ textAlign: 'right' }}>SGST (₹)</th>
                    <th style={{ textAlign: 'right' }}>Total GST (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {gstData.slabs?.map((sl) => (
                    <tr key={sl.rate}>
                      <td>
                        <span style={{
                          background: `${SLAB_COLOR[sl.rate] || '#6b7280'}18`,
                          color: SLAB_COLOR[sl.rate] || '#6b7280',
                          fontWeight: 800, padding: '3px 10px', borderRadius: 99, fontSize: '0.8rem',
                        }}>
                          {sl.rate}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sl.label}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{sl.taxable?.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                        {sl.cgst > 0 ? `₹${sl.cgst?.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>
                        {sl.sgst > 0 ? `₹${sl.sgst?.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: sl.total > 0 ? '#dc2626' : '#10b981' }}>
                        {sl.total > 0 ? `₹${sl.total?.toLocaleString('en-IN')}` : '₹0 (Exempt)'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan={2} style={{ fontWeight: 800 }}>TOTAL</td>
                    <td style={{ textAlign: 'right' }}>₹{gstData.totalSales?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>₹{gstData.totalCgst?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: '#f59e0b' }}>₹{gstData.totalSgst?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626', fontSize: '1.05rem' }}>₹{totalGst?.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Filing checklist */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
              📋 GST Filing Checklist
            </div>
            <div style={{ padding: '1rem 1.25rem' }}>
              {[
                { done: true,  task: 'GSTR-1 — Sales invoices upload (by 11th Nov 2026)' },
                { done: false, task: 'GSTR-3B — Monthly summary + payment (by 20th Nov 2026)' },
                { done: true,  task: 'Input Tax Credit (ITC) — Purchase entries verified' },
                { done: false, task: 'GST payment challan generate karna (PMT-06)' },
              ].map(({ done, task }) => (
                <div key={task} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#dcfce7' : '#fef2f2', color: done ? '#16a34a' : '#dc2626', fontWeight: 900, fontSize: '0.85rem' }}>
                    {done ? '✓' : '!'}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
                    {task}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                    background: done ? '#dcfce7' : '#fef2f2', color: done ? '#16a34a' : '#dc2626' }}>
                    {done ? 'Done ✓' : 'Pending ⚠'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: AI Chatbot Panel */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{
            background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', height: '82vh', overflow: 'hidden',
          }}>
            {/* Chat header */}
            <div style={{
              background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
              padding: '1rem 1.25rem', color: '#fff',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.2)', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>GST Sahayak AI 🧾</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Powered by Google Gemma 4</div>
              </div>
              <div style={{ marginLeft: 'auto', width: 8, height: 8, background: '#4ade80', borderRadius: '50%' }} />
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  {/* avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: msg.role === 'user' ? 'var(--primary)' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {msg.role === 'user'
                      ? <User size={14} color="#fff" />
                      : <Bot  size={14} color="#fff" />}
                  </div>
                  {/* bubble */}
                  <div style={{
                    maxWidth: '78%',
                    background: msg.role === 'user' ? 'var(--primary)' : '#f8fafc',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                    borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    padding: '0.65rem 0.9rem', fontSize: '0.86rem', lineHeight: 1.6,
                  }}>
                    {renderText(msg.text)}
                    {msg.offline && (
                      <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: 4 }}>⚡ Offline mode</div>
                    )}
                  </div>
                </div>
              ))}

              {/* typing indicator */}
              {sending && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={14} color="#fff" />
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px', padding: '0.65rem 1rem' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)',
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick chips */}
            <div style={{ padding: '0 0.85rem 0.5rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUICK_QUESTIONS.map(({ label, q }) => (
                <button key={label} type="button"
                  onClick={() => sendMessage(q)}
                  disabled={sending}
                  style={{
                    padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600,
                    background: '#eff6ff', color: '#1d4ed8',
                    border: '1px solid #bfdbfe', borderRadius: 99, cursor: 'pointer',
                    whiteSpace: 'nowrap', transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div style={{
              padding: '0.75rem', borderTop: '1px solid var(--border)',
              display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}>
              <button
                type="button"
                onClick={toggleVoice}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: listening ? '#fef2f2' : '#f1f5f9',
                  color: listening ? '#dc2626' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title={listening ? 'Stop recording' : 'Voice input (Hindi)'}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                ref={inputRef}
                type="text"
                className="form-input"
                style={{ flex: 1, height: 38, fontSize: '0.88rem' }}
                placeholder="GST ke baare mein kuch puchein… (Hindi/English)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={sending}
              />

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={sending || !input.trim()}
                style={{
                  width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: (!sending && input.trim()) ? 'var(--primary)' : '#e2e8f0',
                  color: (!sending && input.trim()) ? '#fff' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default GSTChatbot;
