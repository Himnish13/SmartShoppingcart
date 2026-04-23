import React, { useEffect, useState, useRef } from 'react';
import { KeyboardReact as Keyboard } from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import './VirtualKeyboard.css';

const selectors = [
  'input.search',
  'input.search-product-input',
  'input[placeholder^="Search"]',
  'input[placeholder*="Search"]',
  'textarea.search',
];

export default function VirtualKeyboardGlobal() {
  const [visible, setVisible] = useState(false);
  const targetRef = useRef(null);
  const [layoutName, setLayoutName] = useState('default');
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('vk_enabled') !== 'false'; } catch (e) { return true; }
  });
  const [keyboardStyle, setKeyboardStyle] = useState({});
  const [docked, setDocked] = useState(() => {
    try { return localStorage.getItem('vk_docked') === 'true'; } catch (e) { return false; }
  });
  const [dockSide, setDockSide] = useState(() => {
    try { return localStorage.getItem('vk_dockSide') || 'right'; } catch (e) { return 'right'; }
  });
  const [compact, setCompact] = useState(() => {
    try { return localStorage.getItem('vk_compact') === 'true'; } catch (e) { return false; }
  });
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const onFocusIn = (e) => {
      try {
        const el = e.target;
        if (!el) return;
        for (const sel of selectors) {
          if (el.matches && el.matches(sel)) {
            targetRef.current = el;
            setVisible(true);
            return;
          }
        }
        setVisible(false);
      } catch (err) {
        setVisible(false);
      }
    };

    const onFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active) return setVisible(false);
        for (const sel of selectors) {
          if (active.matches && active.matches(sel)) return; // keep visible
        }
        setVisible(false);
      }, 50);
    };

    window.addEventListener('focusin', onFocusIn);
    window.addEventListener('focusout', onFocusOut);
    return () => {
      window.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const setNativeValue = (el, value) => {
    const valueSetter = Object.getOwnPropertyDescriptor(el.__proto__, 'value')?.set ||
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (valueSetter) {
      valueSetter.call(el, value);
    } else {
      el.value = value;
    }
    const ev = new Event('input', { bubbles: true });
    el.dispatchEvent(ev);
  };

  const insertAtTarget = (ch) => {
    const el = document.activeElement || targetRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const val = el.value || '';
    const newVal = val.slice(0, start) + ch + val.slice(end);
    setNativeValue(el, newVal);
    el.selectionStart = el.selectionEnd = start + ch.length;
    el.focus();
  };

  const backspaceAtTarget = () => {
    const el = document.activeElement || targetRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    if (start === 0 && end === 0) return;
    const val = el.value || '';
    if (start === end) {
      el.value = val.slice(0, start - 1) + val.slice(end);
      el.selectionStart = el.selectionEnd = Math.max(0, start - 1);
    } else {
      el.value = val.slice(0, start) + val.slice(end);
      el.selectionStart = el.selectionEnd = start;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
  };

  const onKeyPress = (button) => {
    if (button === '{bksp}') return backspaceAtTarget();
    if (button === '{enter}') return insertAtTarget('\n');
    if (button === '{space}') return insertAtTarget(' ');
    if (button === '{shift}') return setLayoutName(layoutName === 'default' ? 'shift' : 'default');
    insertAtTarget(button);
  };
  useEffect(() => {
    if (!visible || !targetRef.current) return setKeyboardStyle({});
    const el = targetRef.current;
    const rect = el.getBoundingClientRect();
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const kbWidth = Math.min(760, vw - 40);
    let left = rect.left + rect.width / 2 - kbWidth / 2;
    left = Math.max(10, Math.min(left, vw - kbWidth - 10));
    // prefer placing above the input if there's space
    const kbHeight = 220; // approximate
    let top = rect.top - kbHeight - 12;
    if (top < 8) top = rect.bottom + 12; // place below if not enough space above
    // if docked, override positioning
    if (docked) {
      const w = compact ? Math.min(360, vw - 40) : Math.min(480, vw - 40);
      const style = { position: 'fixed', bottom: '12px', width: `${w}px` };
      if (dockSide === 'right') style.right = '12px'; else style.left = '12px';
      setKeyboardStyle(style);
    } else {
      setKeyboardStyle({ position: 'fixed', left: `${left}px`, top: `${top}px`, width: `${kbWidth}px` });
    }
  }, [visible, targetRef.current, docked, dockSide, compact]);

  // Keep keyboard visible while typing and reposition on input or resize
  useEffect(() => {
    if (!visible) return;
    const inputs = Array.from(document.querySelectorAll(selectors.join(',')));
    const onInput = (e) => {
      const el = e.target;
      targetRef.current = el;
      setVisible(true);
      // recompute position quickly
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const kbWidth = Math.min(760, vw - 40);
        // detect suggestion boxes near this input
        const suggestions = Array.from(document.querySelectorAll('[class*=suggest], [class*=candidate], .hg-candidate-box'));
        const suggestNear = suggestions.find(s => {
          try {
            const r = s.getBoundingClientRect();
            return Math.abs(r.top - rect.bottom) < 200 && Math.abs(r.left - rect.left) < 300;
          } catch (err) { return false; }
        });
        let left;
        if (suggestNear) {
          const sRect = suggestNear.getBoundingClientRect();
          // if suggestion is left of input, place keyboard to the right, else left/center
          if (sRect.left < rect.left) left = Math.min(vw - kbWidth - 10, rect.right + 10);
          else left = Math.max(10, rect.left + rect.width / 2 - kbWidth / 2);
        } else {
          left = Math.max(10, rect.left + rect.width / 2 - kbWidth / 2);
        }
        let top = rect.top - 220 - 12;
        if (top < 8) top = rect.bottom + 12;
        setKeyboardStyle({ position: 'fixed', left: `${left}px`, top: `${top}px`, width: `${kbWidth}px` });
      });
    };

    inputs.forEach(i => i.addEventListener('input', onInput));
    window.addEventListener('resize', onInput);
    return () => {
      inputs.forEach(i => i.removeEventListener('input', onInput));
      window.removeEventListener('resize', onInput);
    };
  }, [visible]);

  // listen for header toggle events
  useEffect(() => {
    const onToggle = (e) => {
      if (e && e.detail && typeof e.detail.enabled === 'boolean') {
        setEnabled(e.detail.enabled);
      }
    };
    window.addEventListener('vk:toggle', onToggle);
    const onState = (e) => {
      if (!e || !e.detail) return;
      const s = e.detail;
      if (typeof s.docked === 'boolean') setDocked(s.docked);
      if (typeof s.dockSide === 'string') setDockSide(s.dockSide);
      if (typeof s.compact === 'boolean') setCompact(s.compact);
      if (typeof s.enabled === 'boolean') setEnabled(s.enabled);
    };
    window.addEventListener('vk:state', onState);
    return () => {
      window.removeEventListener('vk:toggle', onToggle);
      window.removeEventListener('vk:state', onState);
    };
  }, []);


  if (!visible || !enabled) return null;

  const toggleLocal = () => {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem('vk_enabled', next ? 'true' : 'false'); } catch (e) {}
    window.dispatchEvent(new CustomEvent('vk:state', { detail: { enabled: next } }));
  };

  const toggleDock = () => {
    const next = !docked;
    setDocked(next);
    try { localStorage.setItem('vk_docked', next ? 'true' : 'false'); } catch (e) {}
  };

  const toggleDockSide = () => {
    const next = dockSide === 'right' ? 'left' : 'right';
    setDockSide(next);
    try { localStorage.setItem('vk_dockSide', next); } catch (e) {}
  };

  const toggleCompact = () => {
    const next = !compact;
    setCompact(next);
    try { localStorage.setItem('vk_compact', next ? 'true' : 'false'); } catch (e) {}
  };

  return (
    <div className={`vk-global${compact ? ' vk-compact' : ''}`} role="application" aria-hidden="false" style={keyboardStyle}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 6 }}>
        <button
          title={enabled ? 'Disable virtual keyboard' : 'Enable virtual keyboard'}
          onClick={toggleLocal}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}
        >
          {enabled ? '🔌 On' : '🔌 Off'}
        </button>
        <button title={docked ? 'Undock keyboard' : 'Dock keyboard'} onClick={toggleDock} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}>{docked ? '📌 Docked' : '📌 Dock'}</button>
        {docked && <button title="Switch dock side" onClick={toggleDockSide} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}>{dockSide === 'right' ? '→' : '←'}</button>}
        <button title={compact ? 'Exit compact mode' : 'Compact mode'} onClick={toggleCompact} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}>{compact ? '🔎 Compact' : '🔎 Normal'}</button>
        <button title="Keyboard help" onClick={() => setHelpOpen(h => !h)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}>❔</button>
      </div>
      {helpOpen && (
        <div className="vk-help">
          <strong>Virtual keyboard</strong>
          <div>Use the on-screen keys to type into focused inputs. Dock to pin the keyboard. Compact mode reduces width.</div>
          <div style={{ marginTop: 8, fontSize: 13 }}>- Toggle enable/disable in Settings
          </div>
        </div>
      )}
      <Keyboard
        onKeyPress={onKeyPress}
        layoutName={layoutName}
        layout={{
          default: ['q w e r t y u i o p', 'a s d f g h j k l', '{shift} z x c v b n m {bksp}', '{space} {enter}'],
          shift: ['Q W E R T Y U I O P', 'A S D F G H J K L', '{shift} Z X C V B N M {bksp}', '{space} {enter}'],
        }}
      />
    </div>
  );
}
