import React, { useEffect, useState } from 'react';
import './GlobalHeader.css';

export default function GlobalHeader() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('vk_enabled') !== 'false'; } catch (e) { return true; }
  });

  useEffect(() => {
    const onState = (e) => {
      if (e && e.detail && typeof e.detail.enabled === 'boolean') setEnabled(e.detail.enabled);
    };
    window.addEventListener('vk:state', onState);
    return () => window.removeEventListener('vk:state', onState);
  }, []);

  const openSettings = () => {
    window.dispatchEvent(new CustomEvent('settings:open'));
  };

  return (
    <header className="global-header">
      <div className="global-header-inner">
        <div className="brand">Smart Shopping Cart</div>
        <div className="controls">
          <button className="vk-toggle" onClick={openSettings} aria-expanded={false}>
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}
