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
  // Enable for general editable textareas (e.g., feedback boxes)
  'textarea',
];

export default function VirtualKeyboardGlobal() {
  const [visible, setVisible] = useState(false);
  const targetRef = useRef(null);
  const keyboardRef = useRef(null);
  const dragRef = useRef({ dragging: false, pointerId: null, startX: 0, startY: 0, startLeft: 0, startTop: 0 });
  const [keyboardStyle, setKeyboardStyle] = useState({});
  const [docked, setDocked] = useState(true);
  const [dockSide, setDockSide] = useState(() => {
    try { return localStorage.getItem('vk_dockSide') || 'right'; } catch (e) { return 'right'; }
  });

  const [manualPos, setManualPos] = useState(() => {
    try {
      const raw = localStorage.getItem('vk_manualPos');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const isTextTarget = (el) => {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return !el.readOnly && !el.disabled;
    if (el.tagName !== 'INPUT') return false;
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (type === 'password') return false;
    return !el.readOnly && !el.disabled;
  };

  const isSupportedTarget = (el) => {
    if (!isTextTarget(el)) return false;
    if (!el.matches) return false;
    return selectors.some((sel) => el.matches(sel));
  };

  const getTargetElement = () => {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return active;
    return targetRef.current;
  };

  const computeKeyboardStyle = (el) => {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    const kbWidth = Math.min(44 * 16, vw - 16); // ~44rem max width; clamp to viewport

    if (!docked && manualPos && typeof manualPos.left === 'number' && typeof manualPos.top === 'number') {
      const left = Math.max(8, Math.min(manualPos.left, vw - kbWidth - 8));
      const top = Math.max(8, Math.min(manualPos.top, vh - 8));
      return { position: 'fixed', left: `${left}px`, top: `${top}px`, width: `${kbWidth}px`, right: 'auto', bottom: 'auto' };
    }

    if (!el) {
      // Default: docked to bottom side.
      const style = { position: 'fixed', bottom: '0.5rem', width: `${kbWidth}px`, top: 'auto' };
      if (dockSide === 'right') {
        style.right = '0.5rem';
        style.left = 'auto';
      } else {
        style.left = '0.5rem';
        style.right = 'auto';
      }
      return style;
    }

    // Docked mode: pin to bottom-left/right.
    const style = { position: 'fixed', bottom: '0.5rem', width: `${kbWidth}px`, top: 'auto' };
    if (dockSide === 'right') {
      style.right = '0.5rem';
      style.left = 'auto';
    } else {
      style.left = '0.5rem';
      style.right = 'auto';
    }
    return style;
  };

  useEffect(() => {
    const onFocusIn = (e) => {
      const el = e.target;
      if (isSupportedTarget(el)) {
        targetRef.current = el;
        setVisible(true);
        requestAnimationFrame(() => setKeyboardStyle(computeKeyboardStyle(el)));
      }
    };
    window.addEventListener('focusin', onFocusIn);

    const onPointerDownCapture = (e) => {
      const t = e.target;
      if (keyboardRef.current && keyboardRef.current.contains(t)) return;
      if (isSupportedTarget(t)) {
        targetRef.current = t;
        setVisible(true);
        requestAnimationFrame(() => setKeyboardStyle(computeKeyboardStyle(t)));
        return;
      }
      setVisible(false);
    };

    window.addEventListener('pointerdown', onPointerDownCapture, true);

    return () => {
      window.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('pointerdown', onPointerDownCapture, true);
    };
  }, [docked, dockSide, manualPos]);

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
    const el = getTargetElement();
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
    const el = getTargetElement();
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    if (start === 0 && end === 0) return;
    const val = el.value || '';
    if (start === end) {
      const next = val.slice(0, start - 1) + val.slice(end);
      setNativeValue(el, next);
      el.selectionStart = el.selectionEnd = Math.max(0, start - 1);
    } else {
      const next = val.slice(0, start) + val.slice(end);
      setNativeValue(el, next);
      el.selectionStart = el.selectionEnd = start;
    }
    el.focus();
  };

  const onKeyPress = (button) => {
    if (button === '{bksp}') return backspaceAtTarget();
    if (button === '{space}') return insertAtTarget(' ');
    insertAtTarget(button);
  };
  useEffect(() => {
    if (!visible) return;
    const onResize = () => setKeyboardStyle(computeKeyboardStyle(targetRef.current));
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [visible, docked, dockSide, manualPos]);

  const snapDock = (side) => {
    setDocked(true);
    setDockSide(side);
    try { localStorage.setItem('vk_dockSide', side); } catch (e) {}
    requestAnimationFrame(() => setKeyboardStyle(computeKeyboardStyle(targetRef.current)));
  };

  const onHeaderPointerDown = (e) => {
    if (e.target && e.target.closest && e.target.closest('button')) return;
    const node = keyboardRef.current;
    if (!node) return;

    // Dragging switches to free move mode.
    setDocked(false);

    const rect = node.getBoundingClientRect();
    const pointerId = e.pointerId;
    dragRef.current = {
      dragging: true,
      pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };
    try { e.currentTarget.setPointerCapture(pointerId); } catch (err) {}
    e.preventDefault();
  };

  const onHeaderPointerMove = (e) => {
    const st = dragRef.current;
    if (!st.dragging || st.pointerId !== e.pointerId) return;
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const kbWidth = Math.min(44 * 16, vw - 16);

    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    const left = Math.max(10, Math.min(st.startLeft + dx, vw - kbWidth - 10));
    const top = Math.max(10, Math.min(st.startTop + dy, vh - 10));
    setKeyboardStyle((prev) => ({
      ...prev,
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      bottom: 'auto',
      right: 'auto',
      width: `${kbWidth}px`,
    }));
  };

  const onHeaderPointerUp = (e) => {
    const st = dragRef.current;
    if (!st.dragging || st.pointerId !== e.pointerId) return;
    dragRef.current.dragging = false;

    const node = keyboardRef.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      const next = { left: rect.left, top: rect.top };
      setManualPos(next);
      try { localStorage.setItem('vk_manualPos', JSON.stringify(next)); } catch (err) {}
    }

    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
  };

  if (!visible) return null;

  return (
    <div ref={keyboardRef} className="vk-global" role="application" aria-hidden="false" style={keyboardStyle}>
      <div
        className="vk-header"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        title="Drag to move"
      >
        <div className="vk-header-buttons">
          <button type="button" className="vk-dockbtn" onClick={() => snapDock('left')} title="Dock bottom-left">Left</button>
          <button type="button" className="vk-dockbtn" onClick={() => snapDock('right')} title="Dock bottom-right">Right</button>
        </div>
      </div>
      <Keyboard
        onKeyPress={onKeyPress}
        layout={{
          default: ['Q W E R T Y U I O P', 'A S D F G H J K L', 'Z X C V B N M {bksp}', '{space}'],
        }}
      />
    </div>
  );
}
