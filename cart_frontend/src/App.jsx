import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import StartPage from "./pages/StartPage";
import ListChoicePage from "./pages/ListChoicePage";
import CreateListPage from "./pages/CreateListPage";
import ExplorePage from "./pages/ExplorePage";
import ListPage from "./pages/ListPage";
import ReviewListPage from "./pages/ReviewListPage";
import RoutingPage from "./pages/RoutingPage";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import RemainingPage from "./pages/RemainingPage";
import VirtualKeyboardGlobal from "./components/VirtualKeyboard";
import OffersPage from "./pages/OffersPage";
import { ScanProvider } from "./context/ScanContext";
import ScanPopup from "./components/ScanPopup";

function isEditableTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, option, [contenteditable="true"], [role="textbox"]'
    )
  );
}

function isInteractiveControl(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      [
        'button',
        'a[href]',
        'input',
        'textarea',
        'select',
        'label',
        'summary',
        '[role="button"]',
        '[role="link"]',
        '[data-no-drag-scroll="true"]',
      ].join(',')
    )
  );
}

function getScrollableAncestor(startEl) {
  const rootScrollEl = document.scrollingElement;

  let el = startEl instanceof Element ? startEl : null;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el instanceof HTMLElement) {
      const style = window.getComputedStyle(el);

      const overflowY = style.overflowY;
      const overflowX = style.overflowX;

      const canScrollY =
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
        el.scrollHeight > el.clientHeight + 1;

      const canScrollX =
        (overflowX === "auto" || overflowX === "scroll" || overflowX === "overlay") &&
        el.scrollWidth > el.clientWidth + 1;

      if (canScrollY || canScrollX) return el;
    }

    el = el.parentElement;
  }

  if (
    rootScrollEl &&
    rootScrollEl.scrollHeight > rootScrollEl.clientHeight + 1
  ) {
    return rootScrollEl;
  }

  return null;
}

function setupGlobalDragToScroll() {
  const DRAG_THRESHOLD_MOUSE_PX = 4;
  const DRAG_THRESHOLD_TOUCH_PX = 10;
  const DRAG_THRESHOLD_KIOSK_MOUSE_PX = 10;
  const INTERACTIVE_TARGET_MULTIPLIER = 2.5;
  const DUPLICATE_EVENT_GUARD_MS = 80;

  let active = null;
  let suppressNextClick = null;
  let lastPointerDownAt = 0;

  const root = document.documentElement;

  function clearSuppressNextClick() {
    suppressNextClick = null;
  }

  function preventSelectionWhileDragging(e) {
    if (!active?.dragging) return;
    e.preventDefault();
  }

  function clearActive() {
    if (active?.scrollEl instanceof HTMLElement) {
      const {
        scrollEl,
        prevUserSelect,
        prevWebkitUserSelect,
        prevTouchAction,
      } = active;
      scrollEl.style.userSelect = prevUserSelect;
      scrollEl.style.webkitUserSelect = prevWebkitUserSelect;
      scrollEl.style.touchAction = prevTouchAction;
    }
    active = null;
    root.classList.remove("drag-scroll-no-select");
    root.classList.remove("drag-scroll-active");
  }

  function startDragSession({
    source,
    scrollEl,
    startX,
    startY,
    thresholdPx,
    disableTouchActionOnDrag,
    pointerId,
    touchId,
    interactiveStart,
  }) {
    active = {
      source,
      pointerId,
      touchId,
      startX,
      startY,
      thresholdPx,
      disableTouchActionOnDrag: Boolean(disableTouchActionOnDrag),
      interactiveStart: Boolean(interactiveStart),
      startScrollLeft: scrollEl.scrollLeft,
      startScrollTop: scrollEl.scrollTop,
      scrollEl,
      dragging: false,
      maxAbsDx: 0,
      maxAbsDy: 0,
      prevUserSelect: scrollEl.style.userSelect,
      prevWebkitUserSelect: scrollEl.style.webkitUserSelect,
      prevTouchAction: scrollEl.style.touchAction,
    };

    // Block selection immediately (many kiosk touch panels emulate mouse drags).
    root.classList.add("drag-scroll-no-select");

    scrollEl.style.userSelect = "none";
    scrollEl.style.webkitUserSelect = "none";
  }

  function applyDragDelta(dx, dy) {
    if (!active) return;
    active.maxAbsDx = Math.max(active.maxAbsDx, Math.abs(dx));
    active.maxAbsDy = Math.max(active.maxAbsDy, Math.abs(dy));
    active.scrollEl.scrollLeft = active.startScrollLeft - dx;
    active.scrollEl.scrollTop = active.startScrollTop - dy;
  }

  function maybeStartDragging(dx, dy) {
    if (!active || active.dragging) return true;
    let t = active.thresholdPx ?? DRAG_THRESHOLD_MOUSE_PX;
    if (active.interactiveStart) t *= INTERACTIVE_TARGET_MULTIPLIER;
    if (Math.abs(dx) < t && Math.abs(dy) < t) {
      return false;
    }
    active.dragging = true;
    root.classList.add("drag-scroll-active");

    // Only disable touch actions once we actually start dragging.
    if (active.disableTouchActionOnDrag) {
      active.scrollEl.style.touchAction = "none";
    }
    return true;
  }

  function onPointerMove(e) {
    if (!active || e.pointerId !== active.pointerId) return;

    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;

    if (!maybeStartDragging(dx, dy)) return;

    e.preventDefault();
    applyDragDelta(dx, dy);
  }

  function onPointerUpOrCancel(e) {
    if (!active || e.pointerId !== active.pointerId) return;
    if (active.dragging) {
      suppressNextClick = {
        scrollEl: active.scrollEl,
        distance: Math.max(active.maxAbsDx, active.maxAbsDy),
        source: active.source,
        thresholdPx: active.thresholdPx,
        interactiveStart: active.interactiveStart,
      };
    }

    window.removeEventListener("pointermove", onPointerMove, true);
    window.removeEventListener("pointerup", onPointerUpOrCancel, true);
    window.removeEventListener("pointercancel", onPointerUpOrCancel, true);
    clearActive();
  }

  function onPointerDown(e) {
    // Support mouse + touch + pen.
    // For mouse we only act on left button; touch/pen typically report button=0.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (active) return;
    // New gesture: don't block legitimate taps after a previous drag.
    clearSuppressNextClick();
    if (isEditableTarget(e.target)) return;

    const startEl = e.target instanceof Element ? e.target : null;
    if (isInteractiveControl(startEl)) return;
    const scrollEl = startEl ? getScrollableAncestor(startEl) : null;
    if (!scrollEl) return;

    lastPointerDownAt = Date.now();

    const thresholdPx =
      e.pointerType === "touch" || e.pointerType === "pen"
        ? DRAG_THRESHOLD_TOUCH_PX
        : DRAG_THRESHOLD_MOUSE_PX;

    const disableTouchActionOnDrag =
      e.pointerType === "touch" || e.pointerType === "pen";

    startDragSession({
      source: "pointer",
      scrollEl,
      startX: e.clientX,
      startY: e.clientY,
      thresholdPx,
      disableTouchActionOnDrag,
      pointerId: e.pointerId,
      interactiveStart: false,
    });

    // Ensure we keep receiving pointer events even if the pointer leaves the element.
    try {
      scrollEl.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    window.addEventListener("pointermove", onPointerMove, { capture: true, passive: false });
    window.addEventListener("pointerup", onPointerUpOrCancel, true);
    window.addEventListener("pointercancel", onPointerUpOrCancel, true);
  }

  function onMouseMove(e) {
    if (!active || active.source !== "mouse") return;

    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;

    if (!maybeStartDragging(dx, dy)) return;

    e.preventDefault();
    applyDragDelta(dx, dy);
  }

  function onMouseUp() {
    if (!active || active.source !== "mouse") return;
    if (active.dragging) {
      suppressNextClick = {
        scrollEl: active.scrollEl,
        distance: Math.max(active.maxAbsDx, active.maxAbsDy),
        source: active.source,
        thresholdPx: active.thresholdPx,
        interactiveStart: active.interactiveStart,
      };
    }

    window.removeEventListener("mousemove", onMouseMove, true);
    window.removeEventListener("mouseup", onMouseUp, true);
    clearActive();
  }

  function onMouseDown(e) {
    // Fallback for environments that don't emit pointer events (or emulate touch as mouse).
    if (Date.now() - lastPointerDownAt <= DUPLICATE_EVENT_GUARD_MS) return;
    if (e.button !== 0) return;
    if (active) return;
    // New gesture: don't block legitimate taps after a previous drag.
    clearSuppressNextClick();
    if (isEditableTarget(e.target)) return;

    const startEl = e.target instanceof Element ? e.target : null;
    if (isInteractiveControl(startEl)) return;
    const scrollEl = startEl ? getScrollableAncestor(startEl) : null;
    if (!scrollEl) return;

    startDragSession({
      source: "mouse",
      scrollEl,
      startX: e.clientX,
      startY: e.clientY,
      thresholdPx: DRAG_THRESHOLD_KIOSK_MOUSE_PX,
      disableTouchActionOnDrag: false,
      interactiveStart: false,
    });

    window.addEventListener("mousemove", onMouseMove, { capture: true, passive: false });
    window.addEventListener("mouseup", onMouseUp, true);
  }

  function getTouchById(touchList, touchId) {
    for (const t of touchList) {
      if (t.identifier === touchId) return t;
    }
    return null;
  }

  function onTouchMove(e) {
    if (!active || active.source !== "touch") return;
    const t = getTouchById(e.touches, active.touchId);
    if (!t) return;

    const dx = t.clientX - active.startX;
    const dy = t.clientY - active.startY;

    if (!maybeStartDragging(dx, dy)) return;

    e.preventDefault();
    applyDragDelta(dx, dy);
  }

  function onTouchEndOrCancel(e) {
    if (!active || active.source !== "touch") return;
    const stillDown = getTouchById(e.touches, active.touchId);
    if (stillDown) return;

    if (active.dragging) {
      suppressNextClick = {
        scrollEl: active.scrollEl,
        distance: Math.max(active.maxAbsDx, active.maxAbsDy),
        source: active.source,
        thresholdPx: active.thresholdPx,
        interactiveStart: active.interactiveStart,
      };
    }

    window.removeEventListener("touchmove", onTouchMove, true);
    window.removeEventListener("touchend", onTouchEndOrCancel, true);
    window.removeEventListener("touchcancel", onTouchEndOrCancel, true);
    clearActive();
  }

  function onTouchStart(e) {
    // Fallback path for browsers/devices emitting touch events but not pointer events.
    if (Date.now() - lastPointerDownAt <= DUPLICATE_EVENT_GUARD_MS) return;
    if (active) return;
    // New gesture: don't block legitimate taps after a previous drag.
    clearSuppressNextClick();

    const startEl = e.target instanceof Element ? e.target : null;
    if (!startEl) return;
    if (isEditableTarget(startEl)) return;
    if (isInteractiveControl(startEl)) return;

    const scrollEl = getScrollableAncestor(startEl);
    if (!scrollEl) return;

    const t = e.touches[0];
    if (!t) return;

    startDragSession({
      source: "touch",
      scrollEl,
      startX: t.clientX,
      startY: t.clientY,
      thresholdPx: DRAG_THRESHOLD_TOUCH_PX,
      disableTouchActionOnDrag: true,
      touchId: t.identifier,
      interactiveStart: false,
    });

    window.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
    window.addEventListener("touchend", onTouchEndOrCancel, true);
    window.addEventListener("touchcancel", onTouchEndOrCancel, true);
  }

  function onClickCapture(e) {
    // Suppress only the synthetic click produced by the *same* drag gesture.
    // Any new pointer/touch down clears suppression, so real button taps work.
    if (!suppressNextClick || !(e.target instanceof Element)) return;

    const { scrollEl, distance, thresholdPx, interactiveStart } = suppressNextClick;

    let minDragToSuppress = thresholdPx ?? DRAG_THRESHOLD_TOUCH_PX;
    if (interactiveStart) minDragToSuppress *= INTERACTIVE_TARGET_MULTIPLIER;

    // Always clear after the first click we see post-drag.
    // This prevents breaking subsequent button taps.
    clearSuppressNextClick();

    if (!scrollEl || !scrollEl.contains(e.target)) return;
    if (distance < minDragToSuppress) return;

    e.preventDefault();
    e.stopPropagation();
  }

  document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: false });
  document.addEventListener("mousedown", onMouseDown, { capture: true, passive: false });
  document.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
  document.addEventListener("click", onClickCapture, true);
  document.addEventListener("selectstart", preventSelectionWhileDragging, true);
  document.addEventListener("dragstart", preventSelectionWhileDragging, true);

  return () => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("mousedown", onMouseDown, true);
    document.removeEventListener("touchstart", onTouchStart, true);
    document.removeEventListener("click", onClickCapture, true);
    document.removeEventListener("selectstart", preventSelectionWhileDragging, true);
    document.removeEventListener("dragstart", preventSelectionWhileDragging, true);
    window.removeEventListener("pointermove", onPointerMove, true);
    window.removeEventListener("pointerup", onPointerUpOrCancel, true);
    window.removeEventListener("pointercancel", onPointerUpOrCancel, true);
    window.removeEventListener("mousemove", onMouseMove, true);
    window.removeEventListener("mouseup", onMouseUp, true);
    window.removeEventListener("touchmove", onTouchMove, true);
    window.removeEventListener("touchend", onTouchEndOrCancel, true);
    window.removeEventListener("touchcancel", onTouchEndOrCancel, true);
    clearActive();
  };
}

function App() {
  useEffect(() => {
    return setupGlobalDragToScroll();
  }, []);

  return (
    <ScanProvider>
      <BrowserRouter>
        <VirtualKeyboardGlobal />
        <ScanPopup />
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/list-choice" element={<ListChoicePage />} />
          <Route path="/create-list" element={<CreateListPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/review-list" element={<ReviewListPage />} />
          <Route path="/routing" element={<RoutingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/remaining" element={<RemainingPage />} />
          <Route path="/offers" element={<OffersPage />} />
        </Routes>
      </BrowserRouter>
    </ScanProvider>
  )
}

export default App
