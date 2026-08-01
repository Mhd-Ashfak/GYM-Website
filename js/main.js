// Shared script for OMERO GYM. The current page is read from <body data-page="...">.
// Bookings and the logged-in name are kept in localStorage (front-end only for now).

(function () {
  "use strict";

  // session catalog
  var CATEGORIES = [
    { id: "floor",    label: "General Gym Floor Access",   filter: "Gym Floor Access" },
    { id: "classes",  label: "Group Fitness Classes",      filter: "Group Fitness Classes" },
    { id: "personal", label: "Personal Training (1-on-1)", filter: "Personal Training" }
  ];
  var SESSIONS = [
    { id: "peak-floor", category: "floor", title: "Peak Hours Floor Pass",
      description: "Reservation for dynamic weight training and cardio equipment during premium high-energy intervals.",
      price: 1500, duration: 90 },
    { id: "offpeak-floor", category: "floor", title: "Off-Peak Floor Pass",
      description: "Perfect for crowd-free workouts with total accessibility to all lifting racks and fitness gear.",
      price: 1000, duration: 120 },
    { id: "hiit-blast", category: "classes", title: "High Intensity HIIT Blast",
      description: "Metabolic conditioning, functional intervals, and explosive plyometrics led by elite instructors.",
      price: 2500, duration: 60 },
    { id: "spin", category: "classes", title: "Spin Cycle",
      description: "Beat-driven indoor cycling built for endurance and fat burn.",
      price: 2000, duration: 45 },
    { id: "elite-power", category: "personal", title: "Elite Power & Strength Coaching",
      description: "One-on-one coaching focused on biomechanics, lifting form and progressive overload.",
      price: 5000, duration: 60 }
  ];
  var TIME_BLOCKS = ["06:00 AM", "08:00 AM", "10:00 AM", "04:00 PM", "05:00 PM", "07:00 PM"];
  var SEED_PAST = [
    { id: "OM-4112", title: "High Intensity HIIT Blast", date: "2026-06-12", time: "06:00 AM", price: 2500, status: "Attended" }
  ];

  // storage with an in-memory fallback (localStorage is blocked on file://)
  var mem = {};
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  };
  function setUser(u) { store.set("omero.user", JSON.stringify(u)); }
  function getBookings() { try { return JSON.parse(store.get("omero.bookings")) || []; } catch (e) { return []; } }
  function setBookings(b) { store.set("omero.bookings", JSON.stringify(b)); }

  // helpers
  function el(id) { return document.getElementById(id); }
  function LKR(n) { return "LKR " + n.toLocaleString("en-US"); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function today() { return new Date().toISOString().split("T")[0]; }
  function param(name) { return new URLSearchParams(location.search).get(name); }
  function findSession(id) { for (var i = 0; i < SESSIONS.length; i++) { if (SESSIONS[i].id === id) return SESSIONS[i]; } return null; }

  function icon(name, size) {
    size = size || 16;
    var p = {
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
      timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
      x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
      rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'
    };
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (p[name] || "") + "</svg>";
  }

  // put the dark background (glow, grid, watermark words) on every page
  function paintBackground() {
    var words = ["DISCIPLINE", "TODAY", "STRENGTH", "TOMORROW"].map(function (w) {
      return '<span class="' + (w === "TOMORROW" ? "red" : "") + '">' + w + "</span>";
    }).join("");
    var bg = document.createElement("div");
    bg.className = "bg";
    bg.innerHTML = '<div class="bg-glow"></div><div class="bg-grid"></div>' +
      '<div class="watermark left">' + words + "</div><div class=\"watermark right\">" + words + "</div>";
    document.body.insertBefore(bg, document.body.firstChild);
  }

  // shared: footer year + mobile menu toggle
  function setupChrome() {
    var y = new Date().getFullYear();
    var yearEls = document.querySelectorAll(".js-year");
    for (var i = 0; i < yearEls.length; i++) yearEls[i].textContent = y;

    var toggle = el("navToggle"), menu = el("mobileMenu");
    if (toggle && menu) toggle.addEventListener("click", function () { menu.classList.toggle("open"); });
  }

  // fade sections in as they scroll into view
  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length || !("IntersectionObserver" in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("show");
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("show"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    items.forEach(function (it) { obs.observe(it); });
  }

  // smooth scroll for same-page anchor links
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth" }); }
      });
    });
  }

  // simple form validation on our .field inputs, with real-time feedback
  function validateField(inp) {
    var ok = inp.checkValidity();
    inp.classList.toggle("is-invalid", !ok);
    var err = inp.parentElement.querySelector(".err");
    if (err) err.style.display = ok ? "none" : "block";
    return ok;
  }
  function validateForm(form) {
    var ok = true;
    form.querySelectorAll(".field").forEach(function (inp) { if (!validateField(inp)) ok = false; });
    return ok;
  }
  function wireRealtime(form) {
    form.querySelectorAll(".field").forEach(function (inp) {
      inp.addEventListener("blur", function () { validateField(inp); });
      inp.addEventListener("input", function () { if (inp.classList.contains("is-invalid")) validateField(inp); });
    });
  }

  function initLogin() {
    var form = el("loginForm");
    if (!form) return;
    wireRealtime(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      setUser({ name: "Dedicated Athlete", email: el("li-email").value });
      location.href = "classes.html";
    });
  }

  function initRegister() {
    var form = el("registerForm");
    if (!form) return;
    wireRealtime(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      setUser({ name: el("rg-name").value.trim() || "Dedicated Athlete", email: el("rg-email").value });
      location.href = "classes.html";
    });
  }

  function initContact() {
    var form = el("contactForm");
    if (!form) return;
    wireRealtime(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      var msg = form.parentElement.querySelector(".form-success");
      if (msg) msg.style.display = "block";
      form.reset();
      form.querySelectorAll(".field").forEach(function (i) { i.classList.remove("is-invalid"); });
    });
  }

  // classes catalog: category filter + cards
  function initClasses() {
    var filtersEl = el("filters"), sectionsEl = el("sessionSections");
    if (!filtersEl || !sectionsEl) return;
    var filter = "all";

    function drawFilters() {
      var html = '<button class="pill ' + (filter === "all" ? "active" : "") + '" data-filter="all">All</button>';
      CATEGORIES.forEach(function (c) {
        html += '<button class="pill ' + (filter === c.id ? "active" : "") + '" data-filter="' + c.id + '">' + c.filter + "</button>";
      });
      filtersEl.innerHTML = html;
    }
    function cardHtml(s) {
      return '<article class="card s-card">' +
        "<h3>" + esc(s.title) + "</h3><p>" + esc(s.description) + "</p>" +
        '<div class="s-foot"><div><div class="price">' + LKR(s.price) + "</div>" +
        '<div class="meta">' + icon("clock", 13) + " " + s.duration + " mins</div></div>" +
        '<button class="btn btn-primary" data-book="' + s.id + '">Book Slot ' + icon("arrow", 15) + "</button>" +
        "</div></article>";
    }
    function drawSections() {
      var cats = filter === "all" ? CATEGORIES : CATEGORIES.filter(function (c) { return c.id === filter; });
      sectionsEl.innerHTML = cats.map(function (cat) {
        var items = SESSIONS.filter(function (s) { return s.category === cat.id; });
        if (!items.length) return "";
        return '<section class="section"><div class="section-head"><span class="dot"></span>' +
          "<h2>" + cat.label + '</h2><span class="rule"></span></div>' +
          '<div class="grid2">' + items.map(cardHtml).join("") + "</div></section>";
      }).join("");
    }
    filtersEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter]"); if (!b) return;
      filter = b.getAttribute("data-filter"); drawFilters(); drawSections();
    });
    sectionsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-book]"); if (!b) return;
      location.href = "book.html?session=" + encodeURIComponent(b.getAttribute("data-book"));
    });
    drawFilters(); drawSections();
  }

  // booking flow: stepper, time blocks, summary, confirm -> Bootstrap modal
  function initBook() {
    var sel = el("bk-session"), dateEl = el("bk-date"), blocksEl = el("blocks");
    var stepperEl = el("stepper"), summaryEl = el("summary"), confirmBtn = el("confirmBtn");
    if (!sel) return;

    var state = { sessionId: param("session") || "", date: "", time: "" };
    dateEl.min = today();
    sel.innerHTML = '<option value="">Select a session...</option>' + SESSIONS.map(function (x) {
      return '<option value="' + x.id + '"' + (x.id === state.sessionId ? " selected" : "") + ">" + esc(x.title) + " - " + LKR(x.price) + "</option>";
    }).join("");

    var STEPS = ["Pick a date", "Choose a time block", "Confirm"];
    function stepIndex() { return !state.date ? 0 : !state.time ? 1 : 2; }
    function drawStepper() {
      var idx = stepIndex();
      stepperEl.innerHTML = STEPS.map(function (label, i) {
        var cls = i === idx ? "current" : i < idx ? "done" : "";
        return '<span class="pill step ' + cls + '"><b>' + (i + 1) + "</b> " + label + "</span>";
      }).join("");
    }
    function drawBlocks() {
      if (!state.date) {
        blocksEl.innerHTML = '<div class="blocks-empty">' + icon("calendar", 26) + "<p>Select a date above to reveal live time-block availability.</p></div>";
        return;
      }
      blocksEl.innerHTML = '<div class="blocks">' + TIME_BLOCKS.map(function (t) {
        return '<button type="button" class="block ' + (state.time === t ? "active" : "") + '" data-time="' + t + '">' + t + "</button>";
      }).join("") + "</div>";
    }
    function drawSummary() {
      var s = findSession(state.sessionId);
      var sched = state.date && state.time ? '<div class="sched"><span>Scheduled:</span> ' + state.date + " &middot; " + state.time + "</div>" : "";
      summaryEl.innerHTML =
        '<p class="sum-label">Selected Workout / Class</p>' +
        '<p class="sum-title">' + (s ? esc(s.title) : "Please pick a session") + "</p>" +
        '<div class="sum-grid"><div><p class="sum-label">' + icon("timer", 14) + " Duration</p><p class=\"sum-val\">" + (s ? s.duration + " mins" : "--") + "</p></div>" +
        '<div><p class="sum-label">' + icon("clock", 14) + ' Session Cost</p><p class="sum-val red">' + (s ? LKR(s.price) : "--") + "</p></div></div>" + sched;
    }
    function refresh() {
      drawStepper(); drawBlocks(); drawSummary();
      confirmBtn.disabled = !(findSession(state.sessionId) && state.date && state.time);
    }
    sel.addEventListener("change", function (e) { state.sessionId = e.target.value; refresh(); });
    dateEl.addEventListener("change", function (e) { state.date = e.target.value; state.time = ""; refresh(); });
    blocksEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-time]"); if (!b) return;
      state.time = b.getAttribute("data-time"); refresh();
    });
    confirmBtn.addEventListener("click", function () {
      var s = findSession(state.sessionId);
      if (!s || !state.date || !state.time) return;
      var rec = {
        id: "OM-" + Math.floor(1000 + Math.random() * 9000), status: "Confirmed",
        sessionId: s.id, title: s.title, price: s.price, duration: s.duration, date: state.date, time: state.time
      };
      setBookings([rec].concat(getBookings()));

      var details = el("confirmDetails");
      if (details) details.textContent = s.title + " on " + state.date + " at " + state.time;
      var modalEl = el("bookingModal");
      if (modalEl && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
        state = { sessionId: "", date: "", time: "" };
        sel.selectedIndex = 0; dateEl.value = "";
        refresh();
      } else {
        location.href = "dashboard.html";
      }
    });
    refresh();
  }

  // dashboard: list bookings (upcoming + past)
  function initDashboard() {
    var upEl = el("upcoming"), pastEl = el("past");
    if (!upEl || !pastEl) return;

    function row(b, isPast) {
      var badge = isPast ? '<span class="badge attended">Attended</span>' : '<span class="badge confirmed">Confirmed</span>';
      var action = isPast
        ? '<a class="btn btn-ghost btn-sm" href="book.html?session=' + encodeURIComponent(b.sessionId || "") + '">' + icon("rotate", 13) + " Book Again</a>"
        : '<button class="btn btn-ghost btn-sm" data-cancel="' + b.id + '">' + icon("x", 13) + " Cancel</button>";
      return "<tr><td class=\"id\">" + b.id + "</td>" +
        '<td class="cell-title">' + esc(b.title) + "</td>" +
        '<td class="cell-muted">' + b.date + " &middot; " + b.time + "</td>" +
        '<td class="cell-muted">' + LKR(b.price) + "</td><td>" + badge + "</td>" +
        '<td class="right">' + action + "</td></tr>";
    }
    function table(list, lastHead, isPast) {
      return '<div class="table-wrap"><table><thead><tr>' +
        "<th>Reservation ID</th><th>Session</th><th>Date &amp; Time</th><th>Cost</th><th>Status</th>" +
        '<th class="right">' + lastHead + "</th></tr></thead><tbody>" +
        list.map(function (b) { return row(b, isPast); }).join("") + "</tbody></table></div>";
    }
    function draw() {
      var t = today();
      var all = getBookings();
      var upcoming = all.filter(function (b) { return b.date >= t; });
      var past = all.filter(function (b) { return b.date < t; }).concat(SEED_PAST);

      upEl.innerHTML = upcoming.length
        ? table(upcoming, "Actions", false)
        : '<div class="empty"><p>No upcoming slots yet.</p><a class="btn btn-primary" href="book.html">Book a Slot</a></div>';
      pastEl.innerHTML = past.length ? table(past, "Shortcut", true) : '<div class="empty"><p>No past sessions yet.</p></div>';
    }
    upEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cancel]"); if (!b) return;
      var id = b.getAttribute("data-cancel");
      setBookings(getBookings().filter(function (x) { return x.id !== id; }));
      draw();
    });
    draw();
  }

  document.addEventListener("DOMContentLoaded", function () {
    paintBackground();
    setupChrome();
    setupReveal();
    setupSmoothScroll();

    switch (document.body.getAttribute("data-page")) {
      case "login": initLogin(); break;
      case "register": initRegister(); break;
      case "contact": initContact(); break;
      case "classes": initClasses(); break;
      case "book": initBook(); break;
      case "dashboard": initDashboard(); break;
    }
  });
})();
