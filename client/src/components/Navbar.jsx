import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Store, ChevronDown } from 'lucide-react';

const Navbar = ({ onMenuToggle, shopName, userName }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fallbacks from localStorage if props are not passed
  const displayShopName = shopName || localStorage.getItem('shopName') || 'Apni Dukaan';
  const displayUserName = userName || localStorage.getItem('userName') || 'Dukaandaar';

  const userInitial = displayUserName ? displayUserName.charAt(0).toUpperCase() : 'D';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('shop');
    localStorage.removeItem('shopName');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="navbar-brand-mobile">
          <span>🛒</span>
          <span>Dukaan Sahayak</span>
        </div>

        <div className="navbar-shop-name">
          <Store size={18} color="var(--primary)" />
          <span>{displayShopName}</span>
        </div>
      </div>

      <div className="navbar-user-section" ref={dropdownRef}>
        <button
          type="button"
          className="user-avatar-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <div className="user-avatar-circle">{userInitial}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{displayUserName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Admin</span>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
        </button>

        {dropdownOpen && (
          <div className="user-dropdown-menu">
            <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{displayUserName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{displayShopName}</div>
            </div>
            <button
              type="button"
              className="dropdown-item"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
