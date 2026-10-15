import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  Boxes,
  BookOpen,
  Bot,
  TrendingUp,
  X,
  Sparkles,
  Globe,
  FileText,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard',    label: 'Dashboard',     hindi: 'डैशबोर्ड',   icon: LayoutDashboard },
  { path: '/billing',      label: 'Billing / POS', hindi: 'बिलिंग',      icon: Receipt },
  { path: '/products',     label: 'Products',      hindi: 'सामान',       icon: Package },
  { path: '/customers',    label: 'Customers',     hindi: 'ग्राहक',      icon: Users },
  { path: '/inventory',    label: 'Inventory',     hindi: 'स्टॉक',       icon: Boxes },
  { path: '/khata',        label: 'Digital Khata', hindi: 'उधार खाता',   icon: BookOpen },
  { path: '/assistant',    label: 'AI Assistant',  hindi: 'सहायक AI',    icon: Bot, highlight: true },
  { path: '/reports',      label: 'Reports',       hindi: 'रिपोर्ट्स',   icon: TrendingUp },
  { path: '/digital-guide', label: 'GST·UPI·ONDC', hindi: 'Digital India', icon: Globe, badge: 'NEW' },
  { path: '/gst-report',   label: 'GST Report AI', hindi: 'जीएसटी रिपोर्ट', icon: FileText, highlight: true },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span style={{ fontSize: '1.6rem' }}>🛒</span>
            <div>
              <div style={{ lineHeight: 1.1 }}>Dukaan Sahayak</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
                दुकान सहायक AI
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close menu"
            style={{ marginLeft: 'auto', color: '#ffffff', display: isOpen ? 'flex' : 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => { if (isOpen && onClose) onClose(); }}
              >
                <Icon size={20} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{item.label}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>{item.hindi}</span>
                </div>
                {item.highlight && (
                  <span style={{
                    marginLeft: 'auto', backgroundColor: 'var(--secondary)', color: '#ffffff',
                    fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px',
                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px',
                  }}>
                    <Sparkles size={10} /> AI
                  </span>
                )}
                {item.badge && (
                  <span style={{
                    marginLeft: item.highlight ? '4px' : 'auto',
                    backgroundColor: '#ef4444', color: '#ffffff',
                    fontSize: '0.6rem', padding: '0.15rem 0.45rem', borderRadius: '4px',
                    fontWeight: 800, letterSpacing: '0.03em',
                  }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '0.75rem',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ fontWeight: 600 }}>Dukaan Sahayak v1.0</div>
            <div style={{ opacity: 0.7, fontSize: '0.72rem' }}>Made for Bharat 🇮🇳</div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
