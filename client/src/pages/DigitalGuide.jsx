import React, { useState } from 'react';
import {
  FileText, Smartphone, Globe, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, ArrowRight, Package, TrendingUp,
  IndianRupee, Wifi, ShoppingBag, BookOpen, Star,
} from 'lucide-react';

/* ── Reusable accordion item ───────────────────────────────────────── */
const AccordionItem = ({ icon: Icon, iconColor, title, subtitle, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      border: `1px solid ${iconColor}33`,
      borderRadius: 'var(--radius)',
      marginBottom: '1rem',
      overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1.1rem 1.4rem', background: '#fff',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={iconColor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>
        </div>
        {open ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: '0 1.4rem 1.4rem', background: '#fafbfc', borderTop: `1px solid ${iconColor}22` }}>
          {children}
        </div>
      )}
    </div>
  );
};

/* ── Info card ─────────────────────────────────────────────────────── */
const InfoCard = ({ label, value, sub, color = 'var(--primary)' }) => (
  <div style={{
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '1rem',
    borderLeft: `4px solid ${color}`,
  }}>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>{label}</div>
    <div style={{ fontSize: '1.4rem', fontWeight: 800, color, margin: '4px 0' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</div>}
  </div>
);

/* ── How app solves it pill ─────────────────────────────────────────── */
const SolvePill = ({ text }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#f0fdf4', border: '1px solid #86efac',
    borderRadius: 99, padding: '5px 12px', fontSize: '0.82rem',
    color: '#15803d', fontWeight: 600, width: 'fit-content',
  }}>
    <CheckCircle size={14} /> {text}
  </div>
);

/* ── ONDC product card demo ─────────────────────────────────────────── */
const OndcProductCard = ({ name, price, unit, category, stock }) => (
  <div style={{
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.9rem',
    display: 'flex', alignItems: 'center', gap: '0.85rem',
  }}>
    <div style={{
      width: 48, height: 48, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
      borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.4rem', flexShrink: 0,
    }}>🛍️</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{name}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{category} • {unit} • Stock: {stock}</div>
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>₹{price}</div>
      <div style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>ONDC Live</div>
    </div>
  </div>
);

/* ── GST Rate Badge ─────────────────────────────────────────────────── */
const GstBadge = ({ rate, example }) => (
  <div style={{
    background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }}>
    <div>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rate}% GST Slab</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{example}</div>
    </div>
    <div style={{
      background: rate === 0 ? '#dcfce7' : rate <= 5 ? '#eff6ff' : rate <= 12 ? '#fef3c7' : '#fef2f2',
      color: rate === 0 ? '#16a34a' : rate <= 5 ? '#1d4ed8' : rate <= 12 ? '#92400e' : '#dc2626',
      fontWeight: 800, fontSize: '1.1rem', padding: '4px 12px', borderRadius: 8,
    }}>
      {rate}%
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════ */
const DigitalGuide = () => {
  const [ondcTab, setOndcTab] = useState('what');
  const [upiTab,  setUpiTab]  = useState('what');
  const [gstTab,  setGstTab]  = useState('what');

  const TabBtn = ({ id, label, active, onClick }) => (
    <button
      type="button"
      onClick={() => onClick(id)}
      style={{
        padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
        background: active === id ? 'var(--primary)' : 'transparent',
        color: active === id ? '#fff' : 'var(--text-secondary)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  const sampleProducts = [
    { name: 'Aashirvaad Atta 5kg',    price: 285, unit: 'bag',  category: 'Flour',  stock: 40 },
    { name: 'Tata Salt 1kg',          price: 22,  unit: 'pkt',  category: 'Spices', stock: 120 },
    { name: 'Amul Butter 500g',       price: 275, unit: 'pkt',  category: 'Dairy',  stock: 12 },
    { name: 'Parle-G Biscuits 200g',  price: 20,  unit: 'pkt',  category: 'Snacks', stock: 200 },
  ];

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Digital India Guide 🇮🇳</h1>
          <p className="page-subtitle">
            GST, UPI, aur ONDC — Kirana shops ke liye kya hain, aur Dukaan Sahayak kaise help karta hai
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
          color: '#fff', borderRadius: 'var(--radius)', padding: '0.6rem 1.1rem',
          fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Star size={14} /> MLH Hackathon Demo
        </div>
      </div>

      {/* ── Problem Statement Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)',
        color: '#fff', borderRadius: 'var(--radius)', padding: '1.5rem 2rem',
        marginBottom: '2rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, fontSize: '8rem', opacity: 0.05 }}>🛒</div>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', fontWeight: 700, marginBottom: 8 }}>
          The Problem We're Solving
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.75rem', lineHeight: 1.3 }}>
          "Kirana shops &amp; street vendors often keep no digital records,
          and GST, UPI, and ONDC feel out of reach."
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.75rem', marginTop: '1.25rem' }}>
          {[
            { n: '63M+',  l: 'Kirana shops in India',     c: '#f59e0b' },
            { n: '90%',   l: 'Use paper-only records',     c: '#ef4444' },
            { n: '₹50K',  l: 'Avg. monthly revenue lost',  c: '#f59e0b' },
            { n: '< 5%',  l: 'Are digitally compliant',    c: '#10b981' },
          ].map(({ n, l, c }) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c }}>{n}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════ GST SECTION ═══════════════════════════════ */}
      <AccordionItem
        icon={FileText} iconColor="#2563eb"
        title="GST — Goods &amp; Services Tax"
        subtitle="India ka unified tax system — har product pe ek fix rate"
        defaultOpen={true}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 99, padding: 4, margin: '1rem 0 1.25rem', width: 'fit-content' }}>
          <TabBtn id="what"  label="क्या है?"    active={gstTab} onClick={setGstTab} />
          <TabBtn id="prob"  label="Problem"     active={gstTab} onClick={setGstTab} />
          <TabBtn id="solve" label="Our Solution" active={gstTab} onClick={setGstTab} />
        </div>

        {gstTab === 'what' && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.7 }}>
              GST (2017 से लागू) ने India के सभी indirect taxes को एक tax में बदल दिया।
              हर product और service पर एक fixed rate होता है। यह CGST + SGST या IGST में बंटा होता है।
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <GstBadge rate={0}  example="Rice, Wheat, Milk, Salt" />
              <GstBadge rate={5}  example="Packaged food, Tea, Coffee" />
              <GstBadge rate={12} example="Processed food, Ghee" />
              <GstBadge rate={18} example="Biscuits, Chips, Shampoo" />
              <GstBadge rate={28} example="Aerated drinks, Tobacco" />
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#1e40af' }}>
              💡 <strong>Example:</strong> Aap ₹100 ka Parle-G bechte ho (18% GST slab) → Customer ₹118 deta hai → 
              ₹18 aap government ko dete ho (CGST ₹9 + SGST ₹9)
            </div>
          </div>
        )}

        {gstTab === 'prob' && (
          <div>
            <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.5rem' }}>
              {[
                { p: 'Manually har invoice pe GST calculate karna', icon: '📝' },
                { p: 'Har month GSTR-1 aur GSTR-3B file karna', icon: '📅' },
                { p: 'HSN codes yaad rakhna (thousands of categories)', icon: '🔢' },
                { p: 'Wrong GST rate → penalty from tax department', icon: '⚠️' },
                { p: 'CA ko ledger dekhana → expensive + time consuming', icon: '💸' },
              ].map(({ p, icon }) => (
                <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.6rem 0.85rem', background: '#fff', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)' }}>
                  <span>{icon}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {gstTab === 'solve' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '0.5rem', marginBottom: '1rem' }}>
              <SolvePill text="Auto-calculate GST per invoice" />
              <SolvePill text="HSN codes stored on products" />
              <SolvePill text="Monthly GST summary in Reports" />
              <SolvePill text="CGST + SGST breakdown ready" />
              <SolvePill text="PDF invoice with tax details" />
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem' }}>
              <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 6 }}>📊 GST Report (Reports Page mein milega)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                <InfoCard label="Taxable Sales" value="₹45,200"  sub="This month" color="#2563eb" />
                <InfoCard label="GST Collected" value="₹4,836"   sub="CGST+SGST"   color="#7c3aed" />
                <InfoCard label="Net Payable"   value="₹4,836"   sub="To Govt"      color="#dc2626" />
              </div>
            </div>
          </div>
        )}
      </AccordionItem>

      {/* ══════════════════ UPI SECTION ═══════════════════════════════ */}
      <AccordionItem
        icon={Smartphone} iconColor="#10b981"
        title="UPI — Unified Payments Interface"
        subtitle="PhonePe, GPay, Paytm, BHIM — sab UPI use karte hain"
        defaultOpen={true}
      >
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 99, padding: 4, margin: '1rem 0 1.25rem', width: 'fit-content' }}>
          <TabBtn id="what"  label="क्या है?"    active={upiTab} onClick={setUpiTab} />
          <TabBtn id="prob"  label="Problem"     active={upiTab} onClick={setUpiTab} />
          <TabBtn id="solve" label="Our Solution" active={upiTab} onClick={setUpiTab} />
        </div>

        {upiTab === 'what' && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.7 }}>
              UPI (NPCI ne banaya, 2016 mein launch) ek real-time payment system hai.
              Customer apne phone se kisi bhi dusre UPI ID pe turant paise bhej sakta hai —
              free mein, 24×7, including holidays.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
              {[
                { app: '📱 PhonePe', users: '530M+ users' },
                { app: '🟡 Google Pay', users: '67M+ users' },
                { app: '🔵 Paytm',    users: '350M+ users' },
                { app: '🇮🇳 BHIM',    users: '36M+ users' },
              ].map(({ app, users }) => (
                <div key={app} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{app}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600, marginTop: 3 }}>{users}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#15803d' }}>
              💡 <strong>Flow:</strong> Customer scans QR → enters amount → UPI PIN → money in 3 seconds → 
              Dukaan Sahayak records it as payment automatically
            </div>
          </div>
        )}

        {upiTab === 'prob' && (
          <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.5rem' }}>
            {[
              { p: 'UPI payment aaya — but which customer, which bill?', icon: '❓' },
              { p: 'No reconciliation — ledger aur bank statement mismatch', icon: '📊' },
              { p: 'Udhar customer phir UPI se deta hai — manually entry karni padti hai', icon: '✍️' },
              { p: 'End of day cash + UPI = confusing total', icon: '🧮' },
            ].map(({ p, icon }) => (
              <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.6rem 0.85rem', background: '#fff', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)' }}>
                <span>{icon}</span>
                <span style={{ fontSize: '0.875rem' }}>{p}</span>
              </div>
            ))}
          </div>
        )}

        {upiTab === 'solve' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '0.5rem', marginBottom: '1rem' }}>
              <SolvePill text="UPI as payment mode on every bill" />
              <SolvePill text="Automatically updates Khata balance" />
              <SolvePill text="Daily UPI + Cash summary in Reports" />
              <SolvePill text="WhatsApp payment receipt to customer" />
            </div>
            {/* Payment mode demo */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem' }}>💳 Payment Mode Selection (Billing page mein):</div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {[
                  { v: 'cash',   l: '💵 Cash',  active: false },
                  { v: 'upi',    l: '📱 UPI',   active: true  },
                  { v: 'credit', l: '📒 Udhar', active: false },
                ].map(({ l, active }) => (
                  <div key={l} style={{
                    padding: '0.5rem 1.2rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.9rem',
                    background: active ? 'var(--primary)' : '#f1f5f9',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    border: active ? '2px solid var(--primary)' : '2px solid transparent',
                  }}>{l}</div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                ✅ UPI selected → Khata balance ko automatically 0 karta hai → Receipt WhatsApp pe bhejta hai
              </div>
            </div>
          </div>
        )}
      </AccordionItem>

      {/* ══════════════════ ONDC SECTION ══════════════════════════════ */}
      <AccordionItem
        icon={Globe} iconColor="#7c3aed"
        title="ONDC — Open Network for Digital Commerce"
        subtitle="Government ka open e-commerce network — Amazon ka desi alternative"
        defaultOpen={true}
      >
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 99, padding: 4, margin: '1rem 0 1.25rem', width: 'fit-content' }}>
          <TabBtn id="what"    label="क्या है?"     active={ondcTab} onClick={setOndcTab} />
          <TabBtn id="prob"    label="Problem"      active={ondcTab} onClick={setOndcTab} />
          <TabBtn id="solve"   label="Our Solution" active={ondcTab} onClick={setOndcTab} />
          <TabBtn id="preview" label="🔴 Live Demo" active={ondcTab} onClick={setOndcTab} />
        </div>

        {ondcTab === 'what' && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.7 }}>
              ONDC (2022, Government of India) ek open protocol hai jo Kirana shops ko
              directly online customers se connect karta hai — bina Amazon/Flipkart pe
              dependent hue. Jaise UPI ne banking ko democratize kiya, ONDC e-commerce ko karta hai.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { icon: '🛒', title: 'Buyer App', sub: 'Paytm, Magicpin, Pincode, Meesho — customer kharidta hai' },
                { icon: '🏪', title: 'Seller (Aapki Dukaan)', sub: 'Aapki inventory ONDC pe list hoti hai automatically' },
                { icon: '🚚', title: 'Logistics', sub: 'Dunzo, Shiprocket delivery handle karte hain' },
              ].map(({ icon, title, sub }) => (
                <div key={title} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#5b21b6' }}>
              🎯 <strong>Key Stat:</strong> 9 lakh+ sellers already on ONDC (2024). Government target: 90 crore buyers by 2025.
              Commission: 0-2% (vs Amazon 15-30%)
            </div>
          </div>
        )}

        {ondcTab === 'prob' && (
          <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.5rem' }}>
            {[
              { p: 'Kirana shops ka koi digital catalogue nahi — ONDC join kaise karein?', icon: '📷' },
              { p: 'Product list manually banana padti hai — time consuming', icon: '⏰' },
              { p: 'Technical complexity — API, JSON, protocols समझ नहीं आते', icon: '💻' },
              { p: 'Inventory tracking nahi — online order aaya to stock ka pata nahi', icon: '📦' },
              { p: 'Already Amazon/Flipkart pe hain — do jagah manage karna mushkil', icon: '🤯' },
            ].map(({ p, icon }) => (
              <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.6rem 0.85rem', background: '#fff', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)' }}>
                <span>{icon}</span>
                <span style={{ fontSize: '0.875rem' }}>{p}</span>
              </div>
            ))}
          </div>
        )}

        {ondcTab === 'solve' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '0.5rem', marginBottom: '1rem' }}>
              <SolvePill text="Inventory auto-converts to ONDC catalogue" />
              <SolvePill text="One-click ONDC listing" />
              <SolvePill text="Stock auto-deducts on online orders" />
              <SolvePill text="AI suggests pricing for ONDC market" />
              <SolvePill text="WhatsApp order notifications" />
            </div>
            <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#5b21b6' }}>
              🚀 <strong>Dukaan Sahayak bridge:</strong> Aapki Products page → ONDC catalogue ban jati hai.
              Aapko kuch extra nahi karna — bas inventory add karo, baaki hum handle karte hain.
            </div>
          </div>
        )}

        {ondcTab === 'preview' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.1rem',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={18} />
                <span style={{ fontWeight: 700 }}>ONDC Catalogue Preview — Aapki Dukaan</span>
              </div>
              <div style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
                🔴 LIVE on ONDC Network
              </div>
            </div>
            <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1rem' }}>
              {sampleProducts.map((p) => <OndcProductCard key={p.name} {...p} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.6rem' }}>
              <InfoCard label="Products Listed" value="24"          sub="On ONDC network" color="#7c3aed" />
              <InfoCard label="Online Orders"   value="8"           sub="This week"        color="#2563eb" />
              <InfoCard label="ONDC Revenue"    value="₹3,240"      sub="Extra income"     color="#10b981" />
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShoppingBag size={15} /> Go Live on ONDC
              </button>
              <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={15} /> Sync Inventory
              </button>
            </div>
          </div>
        )}
      </AccordionItem>

      {/* ══════════════════ HOW WE SOLVE ALL 3 ════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a,#1e293b)',
        borderRadius: 'var(--radius)', padding: '2rem', color: '#fff', marginTop: '0.5rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', fontWeight: 700, marginBottom: 8 }}>
            Dukaan Sahayak = One Solution for All 3
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            Ek App — GST ✅ UPI ✅ ONDC ✅
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
          {[
            { icon: '🧾', title: 'GST Ready',         sub: 'Auto-calculate, HSN codes, monthly summary — CA ko ready data', color: '#60a5fa' },
            { icon: '📱', title: 'UPI Integrated',     sub: 'Record UPI payments, reconcile daily, send receipts via WhatsApp', color: '#34d399' },
            { icon: '🌐', title: 'ONDC Ready',         sub: 'Inventory auto-converts to digital catalogue for ONDC network',  color: '#c084fc' },
            { icon: '🤖', title: 'AI Powered',         sub: 'Gemma 4 AI responds in Hindi/Hinglish — no English needed',      color: '#fbbf24' },
          ].map(({ icon, title, sub, color }) => (
            <div key={title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)', padding: '1.1rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: 8 }}>{icon}</div>
              <div style={{ fontWeight: 700, color, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DigitalGuide;
