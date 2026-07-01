/**
 * Embeddable chat widget loader.
 *
 * Usage on any website (one line):
 *   <script src="https://YOUR-PLATFORM.vercel.app/widget.js" data-bot="BOT_ID" async></script>
 *
 * The data-bot attribute selects which bot to load (get the exact snippet
 * from the dashboard). It renders a floating chat bubble in the bottom-right
 * corner; clicking it opens the chat UI in an iframe served from the
 * platform, so the Anthropic API key and all logic stay server-side.
 */
(function () {
  "use strict";

  if (window.__chatWidgetLoaded) return;
  window.__chatWidgetLoaded = true;

  // Locate our own script tag to read the platform origin and the bot id,
  // so this works when embedded on any third-party site.
  function getScriptTag() {
    if (document.currentScript && document.currentScript.src) {
      return document.currentScript;
    }
    var scripts = document.querySelectorAll('script[src*="widget.js"]');
    return scripts.length ? scripts[scripts.length - 1] : null;
  }

  var tag = getScriptTag();
  var BOT_ID = tag ? tag.getAttribute("data-bot") : null;
  var ORIGIN;
  try {
    ORIGIN = new URL(tag && tag.src, window.location.href).origin;
  } catch (e) {
    ORIGIN = window.location.origin;
  }

  if (!BOT_ID) {
    console.error(
      '[chat-widget] Missing data-bot attribute. Embed like: <script src="' +
        ORIGIN +
        '/widget.js" data-bot="YOUR_BOT_ID" async><\/script>'
    );
    return;
  }

  var Z = 2147483000; // near-max z-index

  var defaults = {
    name: "Chat",
    accentColor: "#C2451E",
    bubbleLabel: "Chat with us",
  };

  fetch(ORIGIN + "/api/widget-config?bot=" + encodeURIComponent(BOT_ID))
    .then(function (r) {
      if (!r.ok) throw new Error("widget-config " + r.status);
      return r.json();
    })
    .then(function (cfg) { init(cfg || defaults); })
    .catch(function (err) {
      console.error("[chat-widget] could not load config:", err);
      init(defaults);
    });

  function init(cfg) {
    var accent = cfg.accentColor || defaults.accentColor;
    var open = false;
    var iframeLoaded = false;

    // --- Floating bubble ---------------------------------------------------
    var button = document.createElement("button");
    button.setAttribute("aria-label", cfg.bubbleLabel || defaults.bubbleLabel);
    button.title = cfg.bubbleLabel || defaults.bubbleLabel;
    button.style.cssText =
      "position:fixed;bottom:20px;right:20px;width:60px;height:60px;" +
      "border-radius:50%;border:none;cursor:pointer;z-index:" + Z + ";" +
      "background:" + accent + ";color:#fff;" +
      "box-shadow:0 4px 16px rgba(0,0,0,0.25);" +
      "display:flex;align-items:center;justify-content:center;" +
      "transition:transform .15s ease;padding:0;";
    button.onmouseenter = function () { button.style.transform = "scale(1.08)"; };
    button.onmouseleave = function () { button.style.transform = "scale(1)"; };

    var chatIcon =
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM8 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>';
    var closeIcon =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    button.innerHTML = chatIcon;

    // --- Iframe panel -------------------------------------------------------
    var frame = document.createElement("iframe");
    frame.title = (cfg.name || defaults.name) + " chat";
    frame.setAttribute("allow", "clipboard-write");
    frame.style.cssText =
      "position:fixed;border:none;z-index:" + (Z + 1) + ";display:none;" +
      "border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.3);" +
      "background:#FBF6EC;overflow:hidden;";

    function layout() {
      var mobile = window.innerWidth < 480;
      if (mobile) {
        frame.style.top = "0";
        frame.style.left = "0";
        frame.style.right = "0";
        frame.style.bottom = "0";
        frame.style.width = "100%";
        frame.style.height = "100%";
        frame.style.borderRadius = "0";
      } else {
        frame.style.top = "auto";
        frame.style.left = "auto";
        frame.style.right = "20px";
        frame.style.bottom = "92px";
        frame.style.width = "380px";
        frame.style.height = "min(600px, calc(100vh - 120px))";
        frame.style.borderRadius = "16px";
      }
    }
    window.addEventListener("resize", function () { if (open) layout(); });

    function setOpen(next) {
      open = next;
      if (open && !iframeLoaded) {
        frame.src = ORIGIN + "/widget?bot=" + encodeURIComponent(BOT_ID);
        iframeLoaded = true;
      }
      layout();
      frame.style.display = open ? "block" : "none";
      button.innerHTML = open ? closeIcon : chatIcon;
      // On mobile the iframe covers the bubble; keep the bubble visible on top
      button.style.zIndex = open ? String(Z + 2) : String(Z);
    }

    button.addEventListener("click", function () { setOpen(!open); });

    // The chat UI's × button posts this message from inside the iframe.
    window.addEventListener("message", function (event) {
      if (event.origin !== ORIGIN) return;
      if (event.data && event.data.type === "chat-widget-close") setOpen(false);
    });

    function mount() {
      document.body.appendChild(button);
      document.body.appendChild(frame);
    }
    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount);
  }
})();
