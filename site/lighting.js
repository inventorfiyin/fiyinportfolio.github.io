(function () {
  var clips = Array.prototype.slice.call(document.querySelectorAll(".clip"));
  var dlg = document.getElementById("viewer");
  if (!dlg || typeof dlg.showModal !== "function" || !clips.length) return; // links then open the mp4 directly
  var vid = dlg.querySelector("video"), title = document.getElementById("vt");
  var prev = document.getElementById("vp"), next = document.getElementById("vn");
  var i = 0, opener = null;

  if (clips.length < 2) { prev.hidden = true; next.hidden = true; }

  function show(n) {
    i = (n + clips.length) % clips.length;
    var c = clips[i];
    vid.poster = c.getAttribute("data-poster") || "";
    vid.src = c.getAttribute("href");
    title.textContent = c.getAttribute("data-title");
    var p = vid.play(); if (p && p.catch) p.catch(function () {});
  }

  clips.forEach(function (c, n) {
    c.addEventListener("click", function (e) {
      e.preventDefault(); opener = c; dlg.showModal(); show(n);
    });
  });
  prev.addEventListener("click", function () { show(i - 1); });
  next.addEventListener("click", function () { show(i + 1); });
  document.getElementById("vc").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("keydown", function (e) {
    if (clips.length < 2 || e.target === vid) return;
    if (e.key === "ArrowLeft") show(i - 1);
    if (e.key === "ArrowRight") show(i + 1);
  });
  dlg.addEventListener("close", function () {
    vid.pause(); vid.removeAttribute("src"); vid.load();
    if (opener) opener.focus();
  });
})();
