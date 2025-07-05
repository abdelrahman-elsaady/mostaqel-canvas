import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaTiktok } from 'react-icons/fa6';

// You can replace these with actual icon components or images as needed
const mediaIcons = [
  { href: '#', icon: <FaFacebook />, label: 'Facebook' },
  { href: '#', icon: <FaTwitter />, label: 'Twitter' },
  { href: '#', icon: <FaInstagram />, label: 'Instagram' },
  { href: '#', icon: <FaTiktok />, label: 'TikTok' },
];

const Footer = () => (
  <footer style={{
    width: '100%',
    background: '#eaf1ff',
    padding: '18px 0 8px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    fontSize: '1.08rem',
    color: '#222',
    // marginTop: '32px',
    border: 'none',
  }}>
    <div style={{ textAlign: 'center', marginBottom: 4, fontWeight: 500 }}>
      Intellectual property rights and all rights of the site are reserved.<br />
      info@t-sign.shop حقوق الملكية الفكرية و جميع حقوق الموقع محفوظة 
    </div>
    <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
      {mediaIcons.map((item, idx) => (
        <a
          key={idx}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          style={{ display: 'inline-flex', width: 28, height: 28, alignItems: 'center', justifyContent: 'center', color: '#1963d2', opacity: 0.85, fontSize: 28, transition: 'opacity 0.2s' }}
        >
          {item.icon}
        </a>
      ))}
    </div>
  </footer>
);

export default Footer; 
