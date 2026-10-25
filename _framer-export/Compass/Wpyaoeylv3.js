var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/SbPq8siZIwaOfKyIekIe/Bya5BdHNbtrnhz47cU1t/WPyAOeYLV.js
import { jsx as _jsx } from "react/jsx-runtime";
import { addPropertyControls, ControlType, cx, motion, useSVGTemplate, withCSS } from "./_framer-runtime.js";
import * as React from "react";
import { forwardRef as forwardRef2 } from "react";
var mask = "var(--framer-icon-mask)";
var Base = /* @__PURE__ */ forwardRef2(function(props, ref) {
  return /* @__PURE__ */ _jsx("svg", { ...props, ref, children: props.children });
});
var MotionSVG = motion.create(Base);
var SVG = /* @__PURE__ */ forwardRef2((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx(MotionSVG, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx("svg", { ...rest, ref, children });
});
var svg = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 14.8 16.387 L 13 8.188 L 16.5 4.688 C 18 3.188 18.5 1.188 18 0.188 C 17 -0.313 15 0.188 13.5 1.688 L 10 5.188 L 1.8 3.388 C 1.3 3.288 0.9 3.487 0.7 3.888 L 0.4 4.388 C 0.2 4.888 0.3 5.387 0.7 5.688 L 6 9.188 L 4 12.188 L 1 12.188 L 0 13.188 L 3 15.188 L 5 18.188 L 6 17.188 L 6 14.188 L 9 12.188 L 12.5 17.488 C 12.8 17.887 13.3 17.988 13.8 17.788 L 14.3 17.588 C 14.7 17.288 14.9 16.887 14.8 16.387 Z" fill="transparent" height="18.1875px" id="aPwkiG7BJ" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--js9iwy, 2)" stroke="var(--1m973uw, rgb(0,0,0))" transform="translate(3 2.813)" width="18.1875px"/></svg>';
var getProps = ({ color, height, id, width, width1, ...props }) => {
  return { ...props, JEeZYcamG: width1 ?? props.JEeZYcamG ?? 2, P_DcoRcrY: color ?? props.P_DcoRcrY ?? "rgb(0, 0, 0)" };
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, P_DcoRcrY, JEeZYcamG, ...restProps } = getProps(props);
  const href = useSVGTemplate("216244643", svg);
  return /* @__PURE__ */ _jsx(SVG, { ...restProps, className: cx("framer-ESaPQ", className), layoutId, ref, role: "presentation", style: { "--1m973uw": P_DcoRcrY, "--js9iwy": JEeZYcamG, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx("use", { href }) });
});
var css = [`.framer-ESaPQ { -webkit-mask: ${mask}; aspect-ratio: 1; display: block; mask: ${mask}; width: 24px; }`];
var Icon = withCSS(Component, css, "framer-ESaPQ");
Icon.displayName = "Plane";
var WPyAOeYLV_default = Icon;
addPropertyControls(Icon, { P_DcoRcrY: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType.Color }, JEeZYcamG: { defaultValue: 2, displayStepper: true, hidden: false, max: 16, min: 1, title: "Width", type: ControlType.Number } });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "Icon", "slots": [], "annotations": { "framerIntrinsicHeight": "24", "framerSupportedLayoutHeight": "any-prefer-fixed", "framerVector": '{"name":"Plane","color":{"type":"variable","value":"1m973uw"},"set":{"localId":"vectorSet/ZsiCCGPvG","id":"ZsiCCGPvG","moduleId":"Y7SpbVH16cWqMhj75z1M"}}', "framerContractVersion": "1", "framerImmutableVariables": "true", "framerSupportedLayoutWidth": "any-prefer-fixed", "framerIntrinsicWidth": "24", "framerVariables": '{"P_DcoRcrY":"color","JEeZYcamG":"width1"}' } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  WPyAOeYLV_default as default
};
