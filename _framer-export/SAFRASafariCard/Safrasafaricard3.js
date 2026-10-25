var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/WgIhnNjhlvx8KLcdZheC/PnnH9fQmWaei9ET5lhVd/SAFRASafariCard.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createPortal } from "react-dom";
import { addPropertyControls, ControlType, useIsStaticRenderer } from "./_framer-runtime.js";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
function SAFRASafariCard(props) {
  const { safariName = "Kenya", description = "Explore iconic savannah landscapes and curated wildlife moments with SAFRA\u2019s personal planning support.", duration = "6\u20138 days", highlights = "Masai Mara|Big Five experience|Optional Nairobi stay", image = { src: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200", alt: "Safari landscape" }, cream = "#F8F4EA", ink = "#203D35", orange = "#FF8055", font, previewForm = false, style } = props;
  const isStatic = useIsStaticRenderer();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [launchFailed, setLaunchFailed] = useState(false);
  const [formState, setFormState] = useState({ fullName: "", whatsapp: "", travelers: "1", preferredDate: "", preferredDuration: "", totalBudget: "", specialRequests: "" });
  const openerRef = useRef(null);
  const modalRef = useRef(null);
  const formRef = useRef(null);
  const phoneInputRef = useRef(null);
  const resolvedFontFamily = useMemo(() => {
    const possible = font?.fontSelector;
    const selectorFont = typeof possible === "string" ? possible : "";
    const chosen = font?.fontFamily || selectorFont;
    return chosen && chosen.trim().length > 0 ? chosen : `"Nunito", "Avenir Next", "Segoe UI", sans-serif`;
  }, [font]);
  const highlightItems = useMemo(() => {
    const parts = (highlights || "").split("|").map((item) => item.trim()).filter(Boolean);
    const defaults = ["Masai Mara", "Big Five experience", "Optional Nairobi stay"];
    const merged = [...parts];
    while (merged.length < 3)
      merged.push(defaults[merged.length]);
    return merged.slice(0, 3);
  }, [highlights]);
  const message = useMemo(() => {
    return `Hi SAFRA \u{1F44B}
I\u2019m interested in a Safari trip.

Safari: ${safariName}
Name: ${formState.fullName || "\u2014"}
Travelers: ${formState.travelers || "\u2014"}
Preferred date: ${formState.preferredDate || "\u2014"}
Duration: ${formState.preferredDuration || "\u2014"}
Total budget: ${formState.totalBudget || "\u2014"} DT
Special requests: ${formState.specialRequests || "\u2014"}

I\u2019d like to receive my personalized Safari offer.`;
  }, [formState.fullName, formState.preferredDate, formState.preferredDuration, formState.specialRequests, formState.totalBudget, formState.travelers, safariName]);
  const whatsappHref = useMemo(() => `https://wa.me/21697433003?text=${encodeURIComponent(message)}`, [message]);
  const setField = useCallback((key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);
  const closeModal = useCallback(() => {
    startTransition(() => setIsModalOpen(false));
    if (typeof __dai_window !== "undefined") {
      __dai_window.setTimeout(() => openerRef.current?.focus(), 0);
    }
  }, []);
  const openModal = useCallback(() => {
    startTransition(() => {
      setLaunchFailed(false);
      setIsModalOpen(true);
    });
  }, []);
  useEffect(() => {
    if (previewForm || !isModalOpen || typeof document === "undefined")
      return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isModalOpen, previewForm]);
  useEffect(() => {
    if (previewForm || !isModalOpen || !modalRef.current || typeof document === "undefined")
      return;
    const node = modalRef.current;
    const selector = 'button,[href],input,textarea,[tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(node.querySelectorAll(selector)).filter((el) => !el.hasAttribute("disabled"));
    focusables[0]?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== "Tab" || focusables.length === 0)
        return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeModal, isModalOpen, previewForm]);
  const onSubmit = useCallback((event) => {
    event.preventDefault();
    if (!formRef.current)
      return;
    if (phoneInputRef.current) {
      const digits = phoneInputRef.current.value.replace(/\D/g, "");
      if (digits.length < 6 || digits.length > 15) {
        phoneInputRef.current.setCustomValidity("Please enter a valid WhatsApp number.");
      } else {
        phoneInputRef.current.setCustomValidity("");
      }
    }
    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }
    if (previewForm || isStatic)
      return;
    startTransition(() => setLaunchFailed(false));
    if (typeof __dai_window !== "undefined") {
      try {
        __dai_window.location.assign(whatsappHref);
      } catch (_error) {
        startTransition(() => setLaunchFailed(true));
      }
    }
  }, [isStatic, previewForm, whatsappHref]);
  const formNode = /* @__PURE__ */ _jsxs("form", { ref: formRef, onSubmit, noValidate: true, className: "safra-safari-form", children: [/* @__PURE__ */ _jsx("h3", { style: { margin: 0, fontSize: 34, lineHeight: 1.05, letterSpacing: "-0.02em", fontWeight: 900 }, children: "Let\u2019s plan your Safari" }), /* @__PURE__ */ _jsxs("p", { style: { margin: 0, fontWeight: 800 }, children: ["Selected Safari:", " ", /* @__PURE__ */ _jsx("span", { style: { display: "inline-block", borderRadius: 999, padding: "4px 10px", background: "#FFFFFF", border: `1px solid color-mix(in srgb, ${ink} 16%, transparent)`, whiteSpace: "normal", overflowWrap: "anywhere", verticalAlign: "top" }, children: safariName })] }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 13, opacity: 0.86 }, children: "Your details open a prepared WhatsApp message. Review and tap Send. SAFRA personally prepares your offer and organizes bookings." }), /* @__PURE__ */ _jsxs("div", { className: "safra-safari-form-grid", children: [/* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Full name *", /* @__PURE__ */ _jsx("input", { name: "fullName", required: true, type: "text", maxLength: 120, autoComplete: "name", value: formState.fullName, onChange: (event) => setField("fullName", event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["WhatsApp number *", /* @__PURE__ */ _jsx("input", { ref: phoneInputRef, name: "whatsapp", required: true, type: "tel", maxLength: 40, autoComplete: "tel", value: formState.whatsapp, onChange: (event) => {
    event.currentTarget.setCustomValidity("");
    setField("whatsapp", event.target.value);
  }, style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Travelers *", /* @__PURE__ */ _jsx("input", { name: "travelers", required: true, min: 1, type: "number", value: formState.travelers, onChange: (event) => setField("travelers", event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Preferred travel date", /* @__PURE__ */ _jsx("input", { name: "preferredDate", type: "date", value: formState.preferredDate, onChange: (event) => setField("preferredDate", event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Preferred duration", /* @__PURE__ */ _jsx("input", { name: "preferredDuration", type: "text", maxLength: 60, placeholder: "e.g. 8\u201310 days", value: formState.preferredDuration, onChange: (event) => setField("preferredDuration", event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Total available trip budget (DT) *", /* @__PURE__ */ _jsx("input", { name: "totalBudget", required: true, min: 1, type: "number", value: formState.totalBudget, onChange: (event) => setField("totalBudget", event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } }), /* @__PURE__ */ _jsx("span", { style: { fontSize: 12, opacity: 0.85, fontWeight: 700 }, children: "This is your total party budget for the complete trip, not a planning fee." })] })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Special requests (optional)", /* @__PURE__ */ _jsx("textarea", { name: "specialRequests", rows: 4, maxLength: 1e3, value: formState.specialRequests, onChange: (event) => setField("specialRequests", event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", resize: "vertical", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsx("button", { type: "submit", className: "safra-safari-cta", style: { justifySelf: "start", border: "none", borderRadius: 999, background: orange, color: ink, padding: "12px 18px", fontWeight: 900, cursor: "pointer" }, children: "Continue on WhatsApp" }), launchFailed ? /* @__PURE__ */ _jsx("a", { href: whatsappHref, target: "_self", rel: "noopener", style: { justifySelf: "start", borderRadius: 999, background: orange, color: ink, padding: "12px 18px", textDecoration: "none", fontWeight: 900 }, children: "Open WhatsApp link" }) : null] });
  return /* @__PURE__ */ _jsxs("section", { className: "safra-safari-root", style: { position: "relative", width: "100%", height: "auto", boxSizing: "border-box", fontFamily: resolvedFontFamily, ...style }, children: [/* @__PURE__ */ _jsx("style", { children: `
                .safra-safari-root { container-type:inline-size; }
                .safra-safari-root * { box-sizing:border-box; }
                .safra-safari-root :focus-visible { outline:2px solid ${orange}; outline-offset:3px; }
                .safra-safari-card {
                    width:100%;
                    min-height:400px;
                    border-radius:36px;
                    border:1px solid color-mix(in srgb, ${ink} 13%, transparent);
                    background:${cream};
                    display:grid;
                    grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);
                    overflow:hidden;
                }
                .safra-safari-image-wrap { position:relative; min-height:400px; }
                .safra-safari-image { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:36px 100px 36px 36px; }
                .safra-safari-content { padding:32px; display:grid; align-content:start; gap:14px; min-width:0; color:${ink}; }
                .safra-safari-badge { justify-self:start; font-size:11px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; border-radius:999px; padding:6px 12px; background:#FFFFFF; border:1px solid color-mix(in srgb, ${ink} 18%, transparent); }
                .safra-safari-title { margin:0; font-size:38px; line-height:1.02; letter-spacing:-0.03em; font-weight:900; }
                .safra-safari-desc { margin:0; font-size:16px; line-height:1.45; font-weight:600; opacity:.92; }
                .safra-safari-duration { justify-self:start; border-radius:999px; background:#FFFFFF; border:1px solid color-mix(in srgb, ${ink} 18%, transparent); padding:8px 12px; font-size:14px; font-weight:800; }
                .safra-safari-highlights { display:grid; gap:8px; margin:0; padding:0; list-style:none; }
                .safra-safari-highlights li { display:flex; align-items:flex-start; gap:8px; font-size:14px; font-weight:700; }
                .safra-safari-check { flex-shrink:0; width:18px; height:18px; border-radius:999px; display:grid; place-items:center; background:#FFFFFF; border:1px solid color-mix(in srgb, ${ink} 18%, transparent); font-size:12px; }
                .safra-safari-note { margin:0; font-size:12px; opacity:.82; font-weight:700; }
                .safra-safari-cta { font:inherit; }
                .safra-safari-form {
                    display:grid;
                    gap:12px;
                    background:#FFFFFFD9;
                    border:1px solid color-mix(in srgb, ${ink} 14%, transparent);
                    border-radius:20px;
                    padding:18px;
                }
                .safra-safari-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
                .safra-safari-form input, .safra-safari-form textarea, .safra-safari-form button { font:inherit; }
                .safra-safari-modal-backdrop {
                    position:fixed;
                    inset:0;
                    background:#00000066;
                    z-index:50;
                    display:grid;
                    place-items:center;
                    padding:18px;
                    animation:safraSafariFade .18s ease;
                }
                .safra-safari-modal {
                    width:min(760px,100%);
                    max-height:90dvh;
                    overflow:auto;
                    background:${cream};
                    color:${ink};
                    font-family:${resolvedFontFamily};
                    border-radius:24px;
                    border:1px solid color-mix(in srgb, ${ink} 14%, transparent);
                    padding:18px;
                    display:grid;
                    gap:12px;
                    box-shadow:0 18px 44px rgba(0,0,0,.24);
                    box-sizing:border-box;
                    container-type:inline-size;
                }
                .safra-safari-modal * { box-sizing:border-box; }
                .safra-safari-modal :focus-visible { outline:2px solid ${orange}; outline-offset:3px; }
                @container (max-width: 700px) {
                    .safra-safari-card { grid-template-columns:1fr; }
                    .safra-safari-image-wrap { min-height:260px; height:260px; }
                    .safra-safari-image { border-radius:36px 36px 24px 24px; }
                    .safra-safari-content { padding:24px; }
                    .safra-safari-title { font-size:30px; }
                    .safra-safari-form-grid { grid-template-columns:1fr; }
                }
                @media (max-width: 700px) {
                    .safra-safari-modal .safra-safari-form-grid { grid-template-columns:1fr; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .safra-safari-modal-backdrop { animation:none; }
                }
                @keyframes safraSafariFade {
                    from { opacity:0; }
                    to { opacity:1; }
                }
            ` }), /* @__PURE__ */ _jsxs("article", { className: "safra-safari-card", children: [/* @__PURE__ */ _jsx("div", { className: "safra-safari-image-wrap", children: /* @__PURE__ */ _jsx("img", { src: image.src, srcSet: image.srcSet, alt: image.alt || `${safariName} Safari`, className: "safra-safari-image" }) }), /* @__PURE__ */ _jsxs("div", { className: "safra-safari-content", children: [/* @__PURE__ */ _jsx("span", { className: "safra-safari-badge", children: "Safari collection" }), /* @__PURE__ */ _jsx("h2", { className: "safra-safari-title", children: safariName }), /* @__PURE__ */ _jsx("p", { className: "safra-safari-desc", children: description }), /* @__PURE__ */ _jsx("span", { className: "safra-safari-duration", children: duration }), /* @__PURE__ */ _jsx("ul", { className: "safra-safari-highlights", children: highlightItems.map((item, index) => /* @__PURE__ */ _jsxs("li", { children: [/* @__PURE__ */ _jsx("span", { className: "safra-safari-check", "aria-hidden": true, children: "\u2713" }), /* @__PURE__ */ _jsx("span", { children: item })] }, `${item}-${index}`)) }), /* @__PURE__ */ _jsx("p", { className: "safra-safari-note", children: "Custom trip based on your budget." }), /* @__PURE__ */ _jsx("button", { ref: openerRef, type: "button", onClick: openModal, className: "safra-safari-cta", style: { justifySelf: "start", border: "none", borderRadius: 999, background: orange, color: ink, padding: "12px 18px", fontWeight: 900, cursor: "pointer" }, children: "Request this Safari" })] })] }), previewForm ? /* @__PURE__ */ _jsx("div", { style: { marginTop: 14 }, children: formNode }) : null, !previewForm && isModalOpen && typeof document !== "undefined" && !isStatic ? /* @__PURE__ */ createPortal(/* @__PURE__ */ _jsx("div", { className: "safra-safari-modal-backdrop", role: "presentation", onMouseDown: (event) => {
    if (event.target === event.currentTarget)
      closeModal();
  }, children: /* @__PURE__ */ _jsxs("div", { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-label": "Safari request form", className: "safra-safari-modal", children: [/* @__PURE__ */ _jsx("button", { type: "button", onClick: closeModal, style: { justifySelf: "end", border: "none", borderRadius: 999, background: "#FFFFFF", color: ink, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }, children: "Close" }), formNode] }) }), document.body) : null] });
}
addPropertyControls(SAFRASafariCard, { safariName: { type: ControlType.String, title: "Safari", defaultValue: "Kenya" }, description: { type: ControlType.String, title: "Description", defaultValue: "Explore iconic savannah landscapes and curated wildlife moments with SAFRA\u2019s personal planning support.", displayTextArea: true }, duration: { type: ControlType.String, title: "Duration", defaultValue: "6\u20138 days" }, highlights: { type: ControlType.String, title: "Highlights", defaultValue: "Masai Mara|Big Five experience|Optional Nairobi stay" }, image: { type: ControlType.ResponsiveImage, title: "Image" }, cream: { type: ControlType.Color, title: "Cream", defaultValue: "#F8F4EA" }, ink: { type: ControlType.Color, title: "Ink", defaultValue: "#203D35" }, orange: { type: ControlType.Color, title: "Orange", defaultValue: "#FF8055" }, font: { type: ControlType.Font, title: "Font", defaultValue: { fontSize: 16, variant: "Regular", letterSpacing: "-0.01em", lineHeight: "1.35em" }, controls: "extended", defaultFontType: "sans-serif" }, previewForm: { type: ControlType.Boolean, title: "Preview Form", defaultValue: false } });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "SAFRASafariCard", "slots": [], "annotations": { "framerSupportedLayoutHeight": "auto", "framerContractVersion": "1", "framerSupportedLayoutWidth": "any-prefer-fixed" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  SAFRASafariCard as default
};
