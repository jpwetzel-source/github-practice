(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  document.querySelectorAll(".story-card__toggle").forEach(function (btn) {
    var panelId = btn.getAttribute("aria-controls");
    var panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
    });
  });

  var revealBtn = document.getElementById("reveal-btn");
  var revealMsg = document.getElementById("reveal-message");
  if (revealBtn && revealMsg) {
    revealBtn.addEventListener("click", function () {
      var hidden = revealMsg.hasAttribute("hidden");
      if (hidden) {
        revealMsg.removeAttribute("hidden");
        revealBtn.textContent = "Hide the note";
        revealBtn.setAttribute("aria-expanded", "true");
      } else {
        revealMsg.setAttribute("hidden", "");
        revealBtn.textContent = "Open the note";
        revealBtn.setAttribute("aria-expanded", "false");
      }
    });
    revealBtn.setAttribute("aria-expanded", "false");
    revealBtn.setAttribute("aria-controls", "reveal-message");
  }
})();
