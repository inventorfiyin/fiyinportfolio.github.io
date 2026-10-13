(function () {
  var EMAIL = "inventorfiyin.2022@gmail.com";
  var btns = document.querySelectorAll(".filters button");
  var cards = document.querySelectorAll(".project");
  btns.forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-filter");
      btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      cards.forEach(function (c) { c.hidden = !(f === "All" || c.getAttribute("data-cat").split("|").indexOf(f) > -1); });
    });
  });

  // Contact form delivery. Paste your form service details here.
  //   Formspree:  endpoint "https://formspree.io/f/YOUR_FORM_ID", accessKey ""
  //   Web3Forms:  endpoint "https://api.web3forms.com/submit", accessKey "YOUR_PUBLIC_ACCESS_KEY"
  // While endpoint is empty, the form falls back to opening the visitor's email app.
  var FORM = { endpoint: "", accessKey: "" };

  var form = document.getElementById("cf");
  var status = document.getElementById("cs");
  var sendBtn = form.querySelector("button[type=submit]");

  function setStatus(text, ok) {
    status.textContent = text;
    status.className = "meta" + (ok ? " ok" : "");
  }
  function mailtoFallback(n, m, g) {
    window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Portfolio message from " + n) + "&body=" + encodeURIComponent(g + "\n\nReply to: " + m);
  }
  function failed() {
    status.className = "meta";
    status.textContent = "The message could not be sent. Email me directly at ";
    var a = document.createElement("a");
    a.href = "mailto:" + EMAIL; a.textContent = EMAIL;
    status.appendChild(a);
    status.appendChild(document.createTextNode("."));
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = document.getElementById("cn").value.trim(), m = document.getElementById("ce").value.trim(), g = document.getElementById("cm").value.trim();
    var en = n.length < 2 ? "Enter your name." : "";
    var ee = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m) ? "" : "Enter a valid email address, like name@example.com.";
    var em = g.length < 20 ? "Write at least 20 characters so I know what you need." : "";
    document.getElementById("en").textContent = en;
    document.getElementById("ee").textContent = ee;
    document.getElementById("em").textContent = em;
    if (en || ee || em) return;

    if (document.getElementById("cw").value) { setStatus("Message sent. I will reply to " + m + ".", true); return; } // spam trap

    if (!FORM.endpoint) {
      setStatus("Your email app should open with the message filled in. If it does not, write to " + EMAIL + ".", false);
      mailtoFallback(n, m, g);
      return;
    }

    var payload = { name: n, email: m, message: g, subject: "Portfolio message from " + n };
    if (FORM.accessKey) payload.access_key = FORM.accessKey;

    sendBtn.disabled = true; sendBtn.textContent = "Sending";
    setStatus("Sending your message.", false);

    fetch(FORM.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { return r.ok && d.success !== false && !d.error; });
    }).then(function (ok) {
      if (ok) { form.reset(); setStatus("Message sent. I will reply to " + m + ".", true); }
      else failed();
    }).catch(failed).then(function () {
      sendBtn.disabled = false; sendBtn.textContent = "Send message";
    });
  });

  var out = document.getElementById("tout"), inp = document.getElementById("tin");
  function print(s, cls) { var d = document.createElement("div"); if (cls) d.className = cls; d.textContent = s; out.appendChild(d); out.scrollTop = out.scrollHeight; }
  function list(sel) { return Array.prototype.map.call(document.querySelectorAll(sel), function (x) { return x.textContent; }); }
  var cmds = {
    help: function () { return "Commands: help, about, skills, projects, contact, links, clear"; },
    about: function () { return "Akinyemi Fiyinfoluwa. EEE student at Covenant University, 2023 to 2028. Embedded systems, PCB design and automation."; },
    skills: function () { return Array.prototype.map.call(document.querySelectorAll(".skills > div"), function (d) { return d.querySelector("h3").textContent + ": " + Array.prototype.map.call(d.querySelectorAll("li"), function (l) { return l.textContent; }).join(", "); }).join("\n"); },
    projects: function () { return list(".project h3").join("\n"); },
    contact: function () { return "Email: " + EMAIL + "\nLinkedIn: https://www.linkedin.com/in/fiyinfoluwa2007/"; },
    links: function () { return "GitHub: https://github.com/inventorfiyin/\nLinkedIn: https://www.linkedin.com/in/fiyinfoluwa2007/\nInstagram: https://www.instagram.com/_.fiyin.ak._/"; }
  };
  print("Type help to list commands.");
  print("Welcome. I am Akinyemi Fiyinfoluwa, an embedded systems and hardware design engineer.");
  print("Try: about, skills, projects, links");
  document.getElementById("tf").addEventListener("submit", function (e) {
    e.preventDefault();
    var c = inp.value.trim().toLowerCase(); inp.value = "";
    if (!c) return;
    if (c === "clear") { out.innerHTML = ""; return; }
    print("$ " + c, "c");
    print(Object.prototype.hasOwnProperty.call(cmds, c) ? cmds[c]() : "command not found: " + c + ". Type help.");
  });
})();
