import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import "./LandingPage.css";

const features = [
  {
    icon: CreditCard,
    title: "Fast, simple billing",
    description:
      "Create bills in a few clicks and keep every transaction organized in one place.",
    className: "blue",
  },
  {
    icon: Wallet,
    title: "Digital Khata",
    description:
      "Track udhaar, customer balances, and payment history without a paper register.",
    className: "violet",
  },
  {
    icon: Boxes,
    title: "Smart inventory",
    description:
      "Keep an eye on stock levels and get alerted before popular products run out.",
    className: "cyan",
  },
  {
    icon: BarChart3,
    title: "Sales insights",
    description:
      "Understand sales, expenses, and profit with reports that are easy to read.",
    className: "indigo",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp reminders",
    description:
      "Make it easier to remind customers about pending payments and due balances.",
    className: "green",
  },
  {
    icon: Sparkles,
    title: "AI Dukaan Assistant",
    description:
      "Get help understanding your shop records and everyday business questions.",
    className: "orange",
  },
];

const riseIn = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

function DashboardPreview() {
  return (
    <motion.div
      className="ds-preview-shell"
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
    >
      <div className="ds-preview-window">
        <div className="ds-window-topbar">
          <div className="ds-window-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="ds-window-title">
            <Store size={14} /> Dukaan dashboard
          </div>
          <span className="ds-live-pill">
            <span /> Overview
          </span>
        </div>

        <div className="ds-preview-body">
          <aside className="ds-mini-sidebar">
            <div className="ds-mini-brand">
              <span className="ds-brand-icon"><Store size={17} /></span>
            </div>
            <span className="active"><BarChart3 size={17} /></span>
            <span><CreditCard size={17} /></span>
            <span><Boxes size={17} /></span>
            <span><Wallet size={17} /></span>
          </aside>

          <div className="ds-mini-content">
            <div className="ds-mini-heading">
              <div>
                <span className="ds-eyebrow">MONDAY, 16 OCTOBER</span>
                <h3>Namaste, dukandaar! <span>👋</span></h3>
                <p>Here&apos;s how your shop is doing today.</p>
              </div>
              <span className="ds-mini-avatar">AK</span>
            </div>

            <div className="ds-stat-grid">
              <div className="ds-stat-card">
                <span className="ds-stat-icon"><TrendingUp size={15} /></span>
                <small>Today&apos;s sales</small>
                <strong>₹12,450</strong>
                <em>↑ 12.8% this week</em>
              </div>
              <div className="ds-stat-card">
                <span className="ds-stat-icon violet"><Wallet size={15} /></span>
                <small>Pending Khata</small>
                <strong>₹4,800</strong>
                <em className="muted">Across 8 customers</em>
              </div>
              <div className="ds-stat-card">
                <span className="ds-stat-icon cyan"><Boxes size={15} /></span>
                <small>Low stock items</small>
                <strong>06 items</strong>
                <em className="warning">Needs attention</em>
              </div>
            </div>

            <div className="ds-mini-lower">
              <div className="ds-chart-card">
                <div className="ds-card-heading">
                  <div><strong>Sales overview</strong><small>Weekly performance</small></div>
                  <span>This week <ChevronRight size={12} /></span>
                </div>
                <div className="ds-chart">
                  <div className="ds-chart-y"><span>15k</span><span>10k</span><span>5k</span><span>0</span></div>
                  <div className="ds-chart-bars">
                    {[42, 62, 48, 78, 57, 92, 70].map((height, index) => (
                      <div className="ds-bar-column" key={index}>
                        <span style={{ height: `${height}%` }} className={index === 5 ? "highlight" : ""} />
                        <small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="ds-activity-card">
                <div className="ds-card-heading">
                  <div><strong>Recent activity</strong><small>Latest updates</small></div>
                </div>
                <div className="ds-activity-row">
                  <span className="ds-activity-icon"><CheckCircle2 size={14} /></span>
                  <div><strong>Bill #1048</strong><small>Ramesh Kumar</small></div>
                  <b>+₹850</b>
                </div>
                <div className="ds-activity-row">
                  <span className="ds-activity-icon purple"><Wallet size={14} /></span>
                  <div><strong>Khata payment</strong><small>Priya Stores</small></div>
                  <b>+₹1,200</b>
                </div>
                <div className="ds-activity-row">
                  <span className="ds-activity-icon orange"><BellRing size={14} /></span>
                  <div><strong>Stock alert</strong><small>Cooking oil</small></div>
                  <b className="low">Low</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="ds-float-card ds-float-payment"
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="ds-float-icon"><CheckCircle2 size={17} /></span>
        <span><strong>Payment received</strong><small>UPI transaction recorded</small></span>
        <b>+₹1,500</b>
      </motion.div>

      <motion.div
        className="ds-float-card ds-float-insight"
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="ds-insight-spark"><Sparkles size={16} /></span>
        <span><strong>Your shop is growing!</strong><small>Sales insights, made simple</small></span>
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="ds-landing">
      <header className="ds-navbar">
        <Link to="/" className="ds-logo" aria-label="Dukaan Sahayak home">
          <span className="ds-logo-mark"><Store size={22} strokeWidth={2.3} /></span>
          <span>Dukaan<span className="ds-logo-light">Sahayak</span><small>YOUR DIGITAL SHOP PARTNER</small></span>
        </Link>

        <nav className="ds-nav-links" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#benefits">Why Dukaan Sahayak</a>
        </nav>

        <div className="ds-nav-actions">
          <Link to="/login" className="ds-login-link">Log in</Link>
          <Link to="/register" className="ds-register-btn">Create account <ArrowRight size={16} /></Link>
        </div>
      </header>

      <main>
        <section className="ds-hero">
          <div className="ds-hero-glow ds-glow-one" />
          <div className="ds-hero-glow ds-glow-two" />
          <div className="ds-hero-grid">
            <motion.div
              className="ds-hero-copy"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            >
              <motion.div className="ds-hero-badge" variants={riseIn} transition={{ duration: 0.5 }}>
                <span className="ds-badge-dot" /> MADE FOR INDIA&apos;S SMALL BUSINESSES
              </motion.div>
              <motion.h1 variants={riseIn} transition={{ duration: 0.55 }}>
                Your dukaan.<br />
                <span>One smart step</span><br />
                ahead.
              </motion.h1>
              <motion.p className="ds-hero-description" variants={riseIn} transition={{ duration: 0.55 }}>
                Billing, Khata, stock, and sales reports — all in one simple place.
                Spend less time managing registers and more time growing your business.
              </motion.p>
              <motion.div className="ds-hero-actions" variants={riseIn} transition={{ duration: 0.55 }}>
                <Link to="/register" className="ds-primary-btn">Get started for free <ArrowRight size={18} /></Link>
                <a href="#features" className="ds-secondary-btn"><span className="ds-play-icon">↘</span> Explore features</a>
              </motion.div>
              <motion.div className="ds-trust-row" variants={riseIn} transition={{ duration: 0.55 }}>
                <div className="ds-trust-avatars"><span>A</span><span>R</span><span>S</span><span>+</span></div>
                <div><strong>Built for everyday dukandars</strong><small>Simple tools. Clear records. Better decisions.</small></div>
              </motion.div>
            </motion.div>

            <div className="ds-hero-visual">
              <div className="ds-visual-orbit ds-orbit-one" />
              <div className="ds-visual-orbit ds-orbit-two" />
              <DashboardPreview />
            </div>
          </div>
          <div className="ds-hero-bottom">
            <span><ShieldCheck size={16} /> Your shop records, organized</span>
            <span><BookOpenCheck size={16} /> Easy to learn, easy to use</span>
            <span><TrendingUp size={16} /> Built to help you grow</span>
          </div>
        </section>

        <section className="ds-features-section" id="features">
          <div className="ds-section-container">
            <motion.div
              className="ds-section-heading"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={riseIn}
              transition={{ duration: 0.55 }}
            >
              <span className="ds-section-kicker">EVERYTHING IN ONE PLACE</span>
              <h2>Running your shop, <span>made simpler.</span></h2>
              <p>Everyday business tools designed around the way local shops actually work.</p>
            </motion.div>
            <div className="ds-feature-grid">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    className="ds-feature-card"
                    key={feature.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={riseIn}
                    transition={{ duration: 0.45, delay: index * 0.06 }}
                    whileHover={{ y: -6 }}
                  >
                    <span className={`ds-feature-icon ${feature.className}`}><Icon size={22} /></span>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <a href="#how-it-works" aria-label={`Learn how ${feature.title} works`}>Learn more <ArrowRight size={14} /></a>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="ds-how-section" id="how-it-works">
          <div className="ds-how-container">
            <div className="ds-how-copy">
              <span className="ds-section-kicker">GET STARTED IN MINUTES</span>
              <h2>Less paperwork.<br /><span>More progress.</span></h2>
              <p>Get your shop organized without making things complicated. Start with the tools you need and build from there.</p>
              <Link to="/register" className="ds-primary-btn">Set up your dukaan <ArrowRight size={18} /></Link>
            </div>
            <div className="ds-steps">
              <div className="ds-step">
                <span className="ds-step-number">01</span>
                <div><h3>Create your shop account</h3><p>Add your basic shop details and get started.</p></div>
              </div>
              <div className="ds-step">
                <span className="ds-step-number">02</span>
                <div><h3>Add products and customers</h3><p>Keep products, stock, and customer records together.</p></div>
              </div>
              <div className="ds-step">
                <span className="ds-step-number">03</span>
                <div><h3>Manage your day with clarity</h3><p>Use bills, Khata, and reports to make informed decisions.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="ds-benefits-section" id="benefits">
          <div className="ds-benefits-card">
            <div className="ds-benefits-copy">
              <span className="ds-section-kicker">A BETTER WAY TO MANAGE</span>
              <h2>Your business deserves tools that work <span>as hard as you do.</span></h2>
              <p>Bring daily shop tasks together with a clean, practical workspace made for busy shop owners.</p>
              <ul>
                <li><CheckCircle2 size={18} /> Clear, organized records</li>
                <li><CheckCircle2 size={18} /> Less manual calculation</li>
                <li><CheckCircle2 size={18} /> Quick access to shop insights</li>
              </ul>
              <Link to="/register" className="ds-primary-btn">Start managing smarter <ArrowRight size={18} /></Link>
            </div>
            <div className="ds-benefit-illustration">
              <div className="ds-benefit-circle circle-back" />
              <div className="ds-benefit-circle circle-front" />
              <div className="ds-benefit-tile">
                <span className="ds-benefit-tile-icon"><TrendingUp size={24} /></span>
                <small>SHOP PERFORMANCE</small>
                <strong>All in one view</strong>
                <div className="ds-benefit-mini-chart"><i /><i /><i /><i /><i /><i /><i /></div>
                <div className="ds-benefit-tile-foot"><span>Sales overview</span><span>Easy to follow</span></div>
              </div>
              <span className="ds-benefit-floating"><Sparkles size={17} /> Smart shop tools</span>
            </div>
          </div>
        </section>

        <section className="ds-final-cta">
          <div className="ds-final-cta-glow" />
          <span className="ds-cta-icon"><Store size={23} /></span>
          <h2>Ready to make your dukaan smarter?</h2>
          <p>Bring your everyday shop work into one organized space.</p>
          <Link to="/register" className="ds-cta-white-btn">Create your free account <ArrowRight size={17} /></Link>
          <small>No complicated setup. Just a smarter way to manage your shop.</small>
        </section>
      </main>

      <footer className="ds-footer">
        <Link to="/" className="ds-logo ds-footer-logo">
          <span className="ds-logo-mark"><Store size={20} /></span>
          <span>Dukaan<span className="ds-logo-light">Sahayak</span><small>YOUR DIGITAL SHOP PARTNER</small></span>
        </Link>
        <p>Helping local businesses move forward, one smart step at a time.</p>
        <div className="ds-footer-links"><a href="#features">Features</a><Link to="/login">Log in</Link><Link to="/register">Register</Link></div>
        <span className="ds-copyright">© {new Date().getFullYear()} Dukaan Sahayak. Built for local businesses.</span>
      </footer>
    </div>
  );
}
