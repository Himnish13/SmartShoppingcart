import React, { useEffect, useState } from 'react';
import './SettingsModal.css';

export default function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(() => localStorage.getItem('vk_enabled') === 'true');
  const [docked, setDocked] = useState(() => localStorage.getItem('vk_docked') === 'true');
  const [dockSide, setDockSide] = useState(() => localStorage.getItem('vk_dockSide') || 'bottom');
  const [compact, setCompact] = useState(() => localStorage.getItem('vk_compact') === 'true');

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('settings:open', onOpen);
    return () => window.removeEventListener('settings:open', onOpen);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('vk_enabled', enabled ? 'true' : 'false'); } catch (e) {}
    window.dispatchEvent(new CustomEvent('vk:toggle', { detail: { enabled } }));
    window.dispatchEvent(new CustomEvent('vk:state', { detail: { docked, dockSide, compact, enabled } }));
  }, [enabled]);

  useEffect(() => {
    try { localStorage.setItem('vk_docked', docked ? 'true' : 'false'); } catch (e) {}
    try { localStorage.setItem('vk_dockSide', dockSide); } catch (e) {}
    try { localStorage.setItem('vk_compact', compact ? 'true' : 'false'); } catch (e) {}
    window.dispatchEvent(new CustomEvent('vk:state', { detail: { docked, dockSide, compact, enabled } }));
  }, [docked, dockSide, compact]);

  const close = () => setOpen(false);

  return (
    open ? (
      <div className="settings-overlay" role="dialog" aria-modal="true">
        <div className="settings-modal">
          <h3>App Settings</h3>
          <div className="setting-row">
            <label>Enable Virtual Keyboard</label>
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          </div>
          <div className="setting-row">
            <label>Dock keyboard</label>
            <input type="checkbox" checked={docked} onChange={e => setDocked(e.target.checked)} />
          </div>
          <div className="setting-row">
            <label>Dock Side</label>
            <select value={dockSide} onChange={e => setDockSide(e.target.value)}>
              <option value="bottom">Bottom</option>
              <option value="top">Top</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className="setting-row">
            <label>Compact Mode</label>
            <input type="checkbox" checked={compact} onChange={e => setCompact(e.target.checked)} />
          </div>
          <div className="modal-actions">
            <button onClick={close}>Close</button>
          </div>
        </div>
      </div>
    ) : null
  );
}
