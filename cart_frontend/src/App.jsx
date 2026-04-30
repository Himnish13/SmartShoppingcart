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
import { useScan } from "./context/ScanContext";
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

function ShoppingOutOfStockPopup() {
  const {
    shoppingOosPopupVisible,
    shoppingOosPending,
    closeShoppingOosPopup,
    skipShoppingOos,
    removeShoppingListItems,
  } = useScan();

  if (!shoppingOosPopupVisible || !shoppingOosPending?.length) return null;

  return (
    <div className="scan-modal-backdrop" onClick={closeShoppingOosPopup} style={{ zIndex: 20000 }}>
      <div className="scan-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
        <button className="scan-close" onClick={closeShoppingOosPopup}>
          ✕
        </button>

        <div className="scan-body" style={{ alignItems: "stretch" }}>
          <div className="scan-info" style={{ width: "100%" }}>
            <div className="scan-header-row" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0, color: "#b91c1c" }}>Out of Stock</h3>
              <span className="scan-badge">Shopping List</span>
            </div>
            <div style={{ color: "#666", fontSize: 14 }}>
              Some items in your shopping list are now out of stock.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16, maxHeight: "45vh", overflowY: "auto", paddingRight: 6 }}>
              {shoppingOosPending.map((it) => (
                <div key={it.product_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 12, borderRadius: 12, border: "1px solid #eee", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "#fdf5e6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {it.image_url ? (
                        <img src={it.image_url} alt={it.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <div style={{ fontSize: 24 }}>📦</div>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#1f1f1f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {it.name}
                      </div>
                      <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>Qty: {it.quantity ?? 1}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => removeShoppingListItems(it.product_id)}
                      style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => skipShoppingOos(it.product_id)}
                      style={{ background: "#f3f1ff", color: "#2b2b2b", border: "1px solid #ddd", padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}
                    >
                      Keep
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="scan-footer" style={{ justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            onClick={() => skipShoppingOos(shoppingOosPending.map((x) => x.product_id))}
            style={{ background: "transparent", border: "1px solid #ddd", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 800 }}
          >
            Keep All
          </button>
          <button
            type="button"
            onClick={() => removeShoppingListItems(shoppingOosPending.map((x) => x.product_id))}
            style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 800 }}
          >
            Remove All
          </button>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  useEffect(() => {
    return setupGlobalDragToScroll();
  }, []);

  return (
    <BrowserRouter>
      <VirtualKeyboardGlobal />
      <ScanPopup />
      <ShoppingOutOfStockPopup />
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
  );
}

function App() {
  return (
    <ScanProvider>
      <AppShell />
    </ScanProvider>
  );
}

export default App
