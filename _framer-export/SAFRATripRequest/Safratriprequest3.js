var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/fNUHmOSjHCcTmsaoALYE/PAlSSwb0y4EIRPN9h36S/SAFRATripRequest.js
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { addPropertyControls, ControlType, RenderTarget } from "./_framer-runtime.js";
function SAFRATripRequest(props) {
  const { defaultDestination, defaultMode = "trip", cream, ink, orange, font, visaPreview = "Service", style } = props;
  const [mode, setMode] = useState(defaultMode || "trip");
  const [destination, setDestination] = useState("");
  const [hasQueryDestination, setHasQueryDestination] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [travelersValue, setTravelersValue] = useState("1");
  const [desiredDestination, setDesiredDestination] = useState("");
  const [nationality, setNationality] = useState("");
  const [visaDestinationCountry, setVisaDestinationCountry] = useState("");
  const [preferredTravelDate, setPreferredTravelDate] = useState("");
  const [approximateTravelDate, setApproximateTravelDate] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [budgetValue, setBudgetValue] = useState("");
  const [notes, setNotes] = useState("");
  const [visaFormOpen, setVisaFormOpen] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [purposeOfTravel, setPurposeOfTravel] = useState("");
  const [occupationStatus, setOccupationStatus] = useState("");
  const [flightBooked, setFlightBooked] = useState("");
  const [accommodationBooked, setAccommodationBooked] = useState("");
  const [previousThailandVisit, setPreviousThailandVisit] = useState("");
  const [previousVisaRefusal, setPreviousVisaRefusal] = useState("");
  const [todayISO, setTodayISO] = useState("");
  const [launchFailed, setLaunchFailed] = useState(false);
  const formRef = useRef(null);
  const isCanvasLike = useMemo(() => {
    const target = RenderTarget.current();
    return target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail;
  }, []);
  const shouldPreviewVisaForm = mode === "visa" && isCanvasLike && visaPreview === "Form";
  const showVisaLandingOnly = mode === "visa" && !visaFormOpen && !shouldPreviewVisaForm;
  const resolvedFontFamily = useMemo(() => {
    const possible = font?.fontSelector;
    const selectorFont = typeof possible === "string" ? possible : "";
    const chosen = font?.fontFamily || selectorFont;
    return chosen && chosen.trim().length > 0 ? chosen : `"Nunito", "Avenir Next", "Segoe UI", sans-serif`;
  }, [font]);
  useEffect(() => {
    if (typeof __dai_window !== "undefined") {
      const now = /* @__PURE__ */ new Date();
      const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      setTodayISO(iso);
    }
  }, []);
  useEffect(() => {
    let nextMode = defaultMode;
    let nextDestination = defaultDestination || "thailand";
    let queryDestinationFound = false;
    let nextPreferredDate = "";
    let nextApproximateDate = "";
    let nextDurationDays = "";
    let nextBudget = "";
    let nextTravelers = "";
    let forceTravelerBlank = false;
    let nextCategory = "";
    let nextDesiredDestination = "";
    let nextVisaDestinationCountry = "";
    if (typeof __dai_window !== "undefined") {
      const params = new URLSearchParams(__dai_window.location.search);
      const modeParam = (params.get("mode") || "").toLowerCase();
      if (modeParam === "direct" || modeParam === "visa")
        nextMode = modeParam;
      const queryDestination = params.get("destination");
      if (queryDestination === "thailand" || queryDestination === "egypt" || queryDestination === "turkiye") {
        nextDestination = queryDestination;
        queryDestinationFound = true;
        nextDesiredDestination = queryDestination === "egypt" ? "Egypt" : queryDestination === "turkiye" ? "T\xFCrkiye" : "Thailand";
        nextVisaDestinationCountry = nextDesiredDestination;
      } else if (nextMode === "direct") {
        nextDestination = "";
      }
      nextDesiredDestination = (params.get("desiredDestination") || nextDesiredDestination).slice(0, 120);
      nextVisaDestinationCountry = (params.get("destinationCountry") || nextVisaDestinationCountry).slice(0, 120);
      const nextWhen = (params.get("when") || "").slice(0, 100);
      const firstIsoMatch = nextWhen.match(/\d{4}-\d{2}-\d{2}/);
      if (firstIsoMatch) {
        const isoDate = firstIsoMatch[0];
        if (!Number.isNaN(new Date(isoDate).getTime()))
          nextPreferredDate = isoDate;
      }
      nextApproximateDate = nextPreferredDate;
      const budgetPerTraveler = (params.get("budget") || "").replace(/[^\d]/g, "").slice(0, 8);
      const rawTravelers = (params.get("travelers") || "").trim();
      const travelerNumeric = rawTravelers.replace(/[^\d]/g, "").slice(0, 3);
      const travelerLabel = rawTravelers.toLowerCase();
      nextTravelers = travelerNumeric;
      if (!travelerNumeric) {
        if (travelerLabel === "couple") {
          nextTravelers = "2";
        } else if (travelerLabel === "just me") {
          nextTravelers = "1";
        } else if (travelerLabel === "friends" || travelerLabel === "family") {
          nextTravelers = "";
          forceTravelerBlank = true;
        }
      }
      if (budgetPerTraveler) {
        const perTravelerValue = Number(budgetPerTraveler);
        if (Number.isFinite(perTravelerValue) && perTravelerValue > 0) {
          if (travelerNumeric && Number(travelerNumeric) >= 1) {
            nextBudget = String(perTravelerValue * Number(travelerNumeric));
          } else if (travelerLabel === "couple") {
            nextBudget = String(perTravelerValue * 2);
            nextTravelers = "2";
          } else if (travelerLabel === "just me") {
            nextBudget = String(perTravelerValue);
            nextTravelers = "1";
          } else if (travelerLabel === "friends" || travelerLabel === "family") {
            nextBudget = "";
            nextTravelers = "";
            forceTravelerBlank = true;
          } else {
            nextBudget = budgetPerTraveler;
          }
        }
      }
      const durationQuery = (params.get("duration") || "").toLowerCase();
      const durationMatch = durationQuery.match(/\d+/);
      if (durationMatch) {
        const parsedValue = Number(durationMatch[0]);
        if (Number.isFinite(parsedValue) && parsedValue > 0) {
          const asDays = durationQuery.includes("week") ? parsedValue * 7 : parsedValue;
          nextDurationDays = String(asDays);
        }
      }
      nextCategory = (params.get("category") || "").slice(0, 50);
    }
    setMode(nextMode);
    setVisaFormOpen(nextMode === "visa" ? shouldPreviewVisaForm : false);
    setDestination(nextDestination);
    setHasQueryDestination(queryDestinationFound);
    setCategoryQuery(nextCategory);
    setPreferredTravelDate(nextPreferredDate);
    setApproximateTravelDate(nextApproximateDate);
    setBudgetValue(nextBudget);
    setTravelersValue(Number(nextTravelers) >= 1 ? nextTravelers : forceTravelerBlank ? "" : "1");
    setDurationDays(nextDurationDays);
    setDesiredDestination(nextDesiredDestination);
    setVisaDestinationCountry(nextVisaDestinationCountry);
  }, [defaultDestination, defaultMode, shouldPreviewVisaForm]);
  const destinationName = useMemo(() => {
    if (destination === "egypt")
      return "Egypt";
    if (destination === "turkiye")
      return "T\xFCrkiye";
    if (destination === "thailand")
      return "Thailand";
    return "Not selected";
  }, [destination]);
  function onSubmit(event) {
    event.preventDefault();
    if (!formRef.current)
      return;
    if (mode === "visa") {
      const fullNameInput = formRef.current.elements.namedItem("fullName");
      const nationalityInput = formRef.current.elements.namedItem("nationality");
      const passportInput = formRef.current.elements.namedItem("passportNumber");
      const purposeInput = formRef.current.elements.namedItem("purposeOfTravel");
      const occupationInput = formRef.current.elements.namedItem("occupationStatus");
      if (fullNameInput)
        fullNameInput.setCustomValidity(fullNameInput.value.trim() ? "" : "Please enter full name as on passport.");
      if (nationalityInput)
        nationalityInput.setCustomValidity(nationalityInput.value.trim() ? "" : "Please enter nationality.");
      if (passportInput)
        passportInput.setCustomValidity(passportInput.value.trim() ? "" : "Please enter passport number.");
      if (purposeInput)
        purposeInput.setCustomValidity(purposeInput.value.trim() ? "" : "Please enter purpose of travel.");
      if (occupationInput)
        occupationInput.setCustomValidity(occupationInput.value.trim() ? "" : "Please enter occupation / employment / business status.");
      if (!formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }
      if (arrivalDate && departureDate && new Date(departureDate).getTime() < new Date(arrivalDate).getTime()) {
        __dai_window.alert("Departure date must be on or after arrival date.");
        return;
      }
      if (passportExpiry && todayISO && new Date(passportExpiry).getTime() <= new Date(todayISO).getTime()) {
        __dai_window.alert("Passport expiry must be in the future.");
        return;
      }
    }
    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }
    setLaunchFailed(false);
    if (typeof __dai_window !== "undefined") {
      try {
        __dai_window.location.assign(whatsappHref);
      } catch (_error) {
        setLaunchFailed(true);
      }
    }
  }
  const whatsappHref = useMemo(() => {
    const tripDestinationLine = desiredDestination || (hasQueryDestination ? destinationName : "\u2014");
    const categoryLine = categoryQuery ? `
Category: ${categoryQuery}` : "";
    const base = `Hi SAFRA \u{1F44B}
I\u2019d like to send my ${mode === "visa" ? "visa request" : "trip request"}.
Name: ${fullName || "\u2014"}
Travelers: ${travelersValue || "\u2014"}
WhatsApp: ${whatsApp || "\u2014"}${categoryLine}`;
    const details = mode === "visa" ? `
Service: Thailand Visa Assistance \u2014 55 DT
Destination country: Thailand
Date of birth: ${dateOfBirth || "\u2014"}
Nationality: ${nationality || "\u2014"}
Passport number: ${passportNumber || "\u2014"}
Passport expiry: ${passportExpiry || "\u2014"}
Arrival date: ${arrivalDate || "\u2014"}
Departure date: ${departureDate || "\u2014"}
Purpose of travel: ${purposeOfTravel || "\u2014"}
Occupation / Employment / Business status: ${occupationStatus || "\u2014"}
Flight booked: ${flightBooked || "\u2014"}
Accommodation booked: ${accommodationBooked || "\u2014"}
Previous Thailand visit: ${previousThailandVisit || "\u2014"}
Previous visa refusal: ${previousVisaRefusal || "\u2014"}
Additional notes: ${notes || "\u2014"}
Documents ready to send via WhatsApp: Passport copy, Personal photo, Flight / travel details, Accommodation details, Bank statement / financial proof, Employment / business documents if required.` : `
Destination: ${tripDestinationLine}
Preferred date: ${preferredTravelDate || "\u2014"}
Duration: ${durationDays || "\u2014"} days
Total available budget (DT): ${budgetValue || "\u2014"}
Notes: ${notes || "\u2014"}`;
    const message = `${base}${details}
I\u2019d like to continue planning my request with you.`;
    return `https://wa.me/21697433003?text=${encodeURIComponent(message)}`;
  }, [accommodationBooked, arrivalDate, budgetValue, categoryQuery, dateOfBirth, departureDate, desiredDestination, destinationName, durationDays, flightBooked, fullName, hasQueryDestination, mode, nationality, notes, occupationStatus, passportExpiry, passportNumber, preferredTravelDate, previousThailandVisit, previousVisaRefusal, purposeOfTravel, travelersValue, whatsApp]);
  return /* @__PURE__ */ _jsxs("section", { className: "safra-request-root", style: { position: "relative", width: "100%", boxSizing: "border-box", background: cream, color: ink, fontFamily: resolvedFontFamily, paddingInline: "clamp(20px, 3vw, 32px)", ...style }, children: [/* @__PURE__ */ _jsx("style", { children: `
                .safra-request-root { container-type:inline-size; }
                .safra-request-root input, .safra-request-root textarea, .safra-request-root select, .safra-request-root button { font:inherit; box-sizing:border-box; }
                .safra-request-root :focus-visible { outline:2px solid ${orange}; outline-offset:3px; }
                .safra-request-wrap { max-width:900px; margin:0 auto; display:grid; gap:18px; }
                .safra-request-card { background:#FFFFFFB8; border:1px solid color-mix(in srgb, ${ink} 14%, transparent); border-radius:24px; padding:20px; display:grid; gap:14px; }
                .safra-request-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
                @container (max-width: 740px) {
                    .safra-request-grid { grid-template-columns:1fr; }
                }
                @container (max-width: 810px) {
                    .safra-request-title { font-size:34px !important; }
                }
                @media (max-width: 809px) {
                    .safra-request-root { padding-top:152px !important; }
                }
            ` }), /* @__PURE__ */ _jsxs("div", { className: "safra-request-wrap", children: [!showVisaLandingOnly ? /* @__PURE__ */ _jsxs("header", { className: "safra-request-card", children: [/* @__PURE__ */ _jsx("span", { style: { justifySelf: "start", background: orange, color: ink, borderRadius: 999, padding: "6px 12px", fontWeight: 900, fontSize: 12 }, children: "SAFRA CONCIERGE REQUEST" }), /* @__PURE__ */ _jsx("h1", { className: "safra-request-title", style: { margin: 0, fontSize: 48, lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 900 }, children: mode === "visa" ? "Thailand Visa Assistance" : "Let\u2019s create your trip" }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontWeight: 700 }, children: mode === "visa" ? "Visa approval is decided by the relevant authorities and cannot be guaranteed by SAFRA." : "Tell us a few details about your trip. SAFRA will review your request and contact you personally to prepare your complete travel offer." }), hasQueryDestination && mode !== "visa" ? /* @__PURE__ */ _jsxs("div", { style: { justifySelf: "start", borderRadius: 999, border: `1px solid color-mix(in srgb, ${ink} 16%, transparent)`, background: "#FFFFFF", padding: "6px 12px", fontWeight: 800 }, children: ["Destination: ", destinationName] }) : null, categoryQuery && mode !== "visa" ? /* @__PURE__ */ _jsxs("div", { style: { justifySelf: "start", borderRadius: 999, border: `1px solid color-mix(in srgb, ${ink} 16%, transparent)`, background: "#FFFFFF", padding: "6px 12px", fontWeight: 800 }, children: ["Category: ", categoryQuery] }) : null] }) : null, showVisaLandingOnly ? /* @__PURE__ */ _jsxs("section", { className: "safra-request-card", children: [/* @__PURE__ */ _jsx("h1", { className: "safra-request-title", style: { margin: 0, fontSize: 40, lineHeight: 1.04, fontWeight: 900 }, children: "\u{1F1F9}\u{1F1ED} Thailand Visa Assistance" }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 26, fontWeight: 900 }, children: "55 DT" }), /* @__PURE__ */ _jsxs("ul", { style: { margin: 0, paddingLeft: 20, display: "grid", gap: 8, fontWeight: 700 }, children: [/* @__PURE__ */ _jsx("li", { children: "Document checklist" }), /* @__PURE__ */ _jsx("li", { children: "Document review" }), /* @__PURE__ */ _jsx("li", { children: "Application preparation / guidance" }), /* @__PURE__ */ _jsx("li", { children: "SAFRA support" })] }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontWeight: 700 }, children: "Visa approval is decided by the relevant authorities and cannot be guaranteed by SAFRA." }), /* @__PURE__ */ _jsx("button", { type: "button", onClick: () => setVisaFormOpen(true), style: { justifySelf: "start", border: "none", borderRadius: 999, background: orange, color: ink, padding: "12px 18px", fontWeight: 900, cursor: "pointer" }, children: "Apply for Thailand Visa \u2014 55 DT" })] }) : null, mode !== "visa" || visaFormOpen || shouldPreviewVisaForm ? /* @__PURE__ */ _jsxs("form", { ref: formRef, onSubmit, noValidate: true, className: "safra-request-card", children: [mode === "visa" && !shouldPreviewVisaForm ? /* @__PURE__ */ _jsx("button", { type: "button", onClick: () => setVisaFormOpen(false), style: { justifySelf: "start", border: "none", background: "transparent", color: ink, fontWeight: 800, textDecoration: "underline", cursor: "pointer", padding: 0 }, children: "\u2190 Back to Visa Assistance" }) : null, /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontWeight: 700 }, children: "Your details open in WhatsApp. Review the message and tap Send to share your request with SAFRA." }), mode === "visa" ? /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 24, fontWeight: 900 }, children: "\u{1F1F9}\u{1F1ED} Thailand Visa Assistance \u2014 55 DT" }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontWeight: 700 }, children: "Visa approval is decided by the relevant authorities and cannot be guaranteed by SAFRA." })] }) : null, /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 12, opacity: 0.8 }, children: "* Required" }), /* @__PURE__ */ _jsxs("div", { className: "safra-request-grid", children: [/* @__PURE__ */ _jsx("input", { type: "hidden", name: "destination", value: destination }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: [mode === "visa" ? "Full name as on passport *" : "Full name *", /* @__PURE__ */ _jsx("input", { name: "fullName", autoComplete: "name", required: true, maxLength: 120, type: "text", value: fullName, onChange: (event) => {
    event.currentTarget.setCustomValidity("");
    setFullName(event.target.value);
  }, placeholder: "Your full name", style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["WhatsApp number *", /* @__PURE__ */ _jsx("input", { name: "whatsApp", autoComplete: "tel", required: true, maxLength: 40, type: "tel", value: whatsApp, onChange: (event) => setWhatsApp(event.target.value), placeholder: "+216 ...", style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Travelers *", /* @__PURE__ */ _jsx("input", { name: "travelers", required: true, min: 1, type: "number", value: travelersValue, onChange: (event) => setTravelersValue(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), (mode === "direct" || !hasQueryDestination) && mode !== "visa" ? /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Desired destination", hasQueryDestination ? "" : " *", /* @__PURE__ */ _jsx("input", { name: "desiredDestination", required: !hasQueryDestination, maxLength: 120, type: "text", value: desiredDestination, onChange: (event) => setDesiredDestination(event.target.value), placeholder: "e.g. Thailand, Egypt, T\xFCrkiye", style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }) : null, mode === "visa" ? /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Date of birth *", /* @__PURE__ */ _jsx("input", { name: "dateOfBirth", required: true, max: todayISO || void 0, type: "date", value: dateOfBirth, onChange: (event) => setDateOfBirth(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Nationality *", /* @__PURE__ */ _jsx("input", { name: "nationality", required: true, maxLength: 120, type: "text", value: nationality, onChange: (event) => {
    event.currentTarget.setCustomValidity("");
    setNationality(event.target.value);
  }, placeholder: "Your nationality", style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Destination country", /* @__PURE__ */ _jsx("input", { name: "visaDestinationCountry", readOnly: true, type: "text", value: "Thailand", style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#F9F9F9", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Passport number *", /* @__PURE__ */ _jsx("input", { name: "passportNumber", required: true, maxLength: 40, type: "text", value: passportNumber, onChange: (event) => {
    event.currentTarget.setCustomValidity("");
    setPassportNumber(event.target.value);
  }, style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Passport expiry *", /* @__PURE__ */ _jsx("input", { name: "passportExpiry", required: true, min: todayISO || void 0, type: "date", value: passportExpiry, onChange: (event) => setPassportExpiry(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Arrival date *", /* @__PURE__ */ _jsx("input", { name: "arrivalDate", required: true, min: todayISO || void 0, type: "date", value: arrivalDate, onChange: (event) => setArrivalDate(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Departure date *", /* @__PURE__ */ _jsx("input", { name: "departureDate", required: true, min: arrivalDate || todayISO || void 0, type: "date", value: departureDate, onChange: (event) => setDepartureDate(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Purpose of travel *", /* @__PURE__ */ _jsx("input", { name: "purposeOfTravel", required: true, maxLength: 120, type: "text", value: purposeOfTravel, onChange: (event) => {
    event.currentTarget.setCustomValidity("");
    setPurposeOfTravel(event.target.value);
  }, style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Occupation / Employment / Business status *", /* @__PURE__ */ _jsx("input", { name: "occupationStatus", required: true, maxLength: 120, type: "text", value: occupationStatus, onChange: (event) => {
    event.currentTarget.setCustomValidity("");
    setOccupationStatus(event.target.value);
  }, style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Flight booked *", /* @__PURE__ */ _jsxs("select", { name: "flightBooked", required: true, value: flightBooked, onChange: (event) => setFlightBooked(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink }, children: [/* @__PURE__ */ _jsx("option", { value: "", children: "Select" }), /* @__PURE__ */ _jsx("option", { value: "Yes", children: "Yes" }), /* @__PURE__ */ _jsx("option", { value: "No", children: "No" })] })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Accommodation booked *", /* @__PURE__ */ _jsxs("select", { name: "accommodationBooked", required: true, value: accommodationBooked, onChange: (event) => setAccommodationBooked(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink }, children: [/* @__PURE__ */ _jsx("option", { value: "", children: "Select" }), /* @__PURE__ */ _jsx("option", { value: "Yes", children: "Yes" }), /* @__PURE__ */ _jsx("option", { value: "No", children: "No" })] })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Previous Thailand visit *", /* @__PURE__ */ _jsxs("select", { name: "previousThailandVisit", required: true, value: previousThailandVisit, onChange: (event) => setPreviousThailandVisit(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink }, children: [/* @__PURE__ */ _jsx("option", { value: "", children: "Select" }), /* @__PURE__ */ _jsx("option", { value: "Yes", children: "Yes" }), /* @__PURE__ */ _jsx("option", { value: "No", children: "No" })] })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Previous visa refusal *", /* @__PURE__ */ _jsxs("select", { name: "previousVisaRefusal", required: true, value: previousVisaRefusal, onChange: (event) => setPreviousVisaRefusal(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink }, children: [/* @__PURE__ */ _jsx("option", { value: "", children: "Select" }), /* @__PURE__ */ _jsx("option", { value: "Yes", children: "Yes" }), /* @__PURE__ */ _jsx("option", { value: "No", children: "No" })] })] })] }) : /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Preferred travel date", /* @__PURE__ */ _jsx("input", { name: "preferredTravelDate", type: "date", value: preferredTravelDate, onChange: (event) => setPreferredTravelDate(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Duration (days)", /* @__PURE__ */ _jsx("input", { name: "durationDays", min: 1, type: "number", value: durationDays, onChange: (event) => setDurationDays(event.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Total available budget (DT) *", /* @__PURE__ */ _jsx("input", { name: "totalTripBudgetDT", required: true, min: 1, type: "number", value: budgetValue, onChange: (event) => setBudgetValue(event.target.value), placeholder: "2900", style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } }), /* @__PURE__ */ _jsx("span", { style: { fontSize: 12, fontWeight: 600, opacity: 0.85 }, children: "Your budget helps us build the best complete trip possible for you. This is your total available budget for the complete trip\u2014not a planning fee." })] })] })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: [mode === "visa" ? "Additional notes (optional)" : "Notes (optional)", /* @__PURE__ */ _jsx("textarea", { name: "notes", maxLength: 1500, rows: 4, value: notes, onChange: (event) => setNotes(event.target.value), placeholder: "Anything else you'd like SAFRA to know?", style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 20%, transparent)`, padding: "11px 12px", resize: "vertical", minWidth: 0, width: "100%", background: "#FFFFFF", color: ink } })] }), mode === "visa" ? /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 12, fontWeight: 700, opacity: 0.9 }, children: "Passport details are included in the pre-filled WhatsApp message when you continue. Review before sending. Documents are sent separately through WhatsApp." }), /* @__PURE__ */ _jsxs("div", { style: { display: "grid", gap: 8, borderRadius: 12, border: `1px solid color-mix(in srgb, ${ink} 16%, transparent)`, background: "#FFFFFF", padding: "12px" }, children: [/* @__PURE__ */ _jsx("div", { style: { fontWeight: 800 }, children: "Send these documents through WhatsApp" }), /* @__PURE__ */ _jsxs("ul", { style: { margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontWeight: 700 }, children: [/* @__PURE__ */ _jsx("li", { children: "Passport copy" }), /* @__PURE__ */ _jsx("li", { children: "Personal photo" }), /* @__PURE__ */ _jsx("li", { children: "Flight / travel details" }), /* @__PURE__ */ _jsx("li", { children: "Accommodation details" }), /* @__PURE__ */ _jsx("li", { children: "Bank statement / financial proof" }), /* @__PURE__ */ _jsx("li", { children: "Employment / business documents if required" })] })] })] }) : null, /* @__PURE__ */ _jsx("button", { type: "submit", style: { justifySelf: "start", border: "none", borderRadius: 999, background: orange, color: ink, padding: "12px 18px", fontWeight: 900, cursor: "pointer" }, children: "Continue on WhatsApp" }), launchFailed ? /* @__PURE__ */ _jsxs("div", { style: { display: "grid", gap: 10 }, children: [/* @__PURE__ */ _jsx("p", { role: "alert", style: { margin: 0, fontWeight: 900 }, children: "Couldn\u2019t open WhatsApp automatically. Use this link:" }), /* @__PURE__ */ _jsx("a", { href: whatsappHref, target: "_self", rel: "noopener", style: { justifySelf: "start", borderRadius: 999, background: orange, color: ink, padding: "12px 18px", textDecoration: "none", fontWeight: 900 }, children: "Continue on WhatsApp" })] }) : null] }) : null] })] });
}
addPropertyControls(SAFRATripRequest, { defaultDestination: { type: ControlType.Enum, title: "Destination", options: ["thailand", "egypt", "turkiye"], optionTitles: ["Thailand", "Egypt", "T\xFCrkiye"], defaultValue: "thailand" }, defaultMode: { type: ControlType.Enum, title: "Mode", options: ["trip", "direct", "visa"], optionTitles: ["Trip", "Direct", "Visa"], defaultValue: "trip" }, cream: { type: ControlType.Color, title: "Cream", defaultValue: "#F8F4EA" }, ink: { type: ControlType.Color, title: "Ink", defaultValue: "#203D35" }, orange: { type: ControlType.Color, title: "Orange", defaultValue: "#FF8055" }, font: { type: ControlType.Font, title: "Font", defaultValue: { fontSize: 16, variant: "Regular", letterSpacing: "-0.01em", lineHeight: "1.35em" }, controls: "extended", defaultFontType: "sans-serif" }, visaPreview: { type: ControlType.Enum, title: "Visa Preview", options: ["Service", "Form"], defaultValue: "Service", hidden: (props) => props.defaultMode !== "visa" } });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "SAFRATripRequest", "slots": [], "annotations": { "framerContractVersion": "1", "framerSupportedLayoutHeight": "auto", "framerSupportedLayoutWidth": "any-prefer-fixed" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  SAFRATripRequest as default
};
