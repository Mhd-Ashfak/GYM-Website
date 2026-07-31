// Main script for OMERO GYM. Handles the interactive bits used across pages:
// navbar shadow on scroll, smooth scrolling, scroll fade-ins, class filtering,
// form validation, and the booking flow (saved in localStorage for now).

document.addEventListener("DOMContentLoaded", function () {
  setupNavbarScroll();
  setupSmoothScroll();
  setupScrollReveal();
  setupYear();
  setupClassFilter();
  setupFormValidation();
  setupBooking();
  renderDashboard();
});

// Add a shadow to the navbar after the user scrolls a little.
function setupNavbarScroll() {
  var navbar = document.querySelector(".navbar");
  if (!navbar) return;
  window.addEventListener("scroll", function () {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });
}

// Smooth scroll for links that point to a section on the same page.
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

// Fade elements in as they enter the screen.
function setupScrollReveal() {
  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(function (item) { observer.observe(item); });
}

// Fill the current year in the footer.
function setupYear() {
  document.querySelectorAll(".js-year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
}

// Filter the class cards by category on the classes page.
function setupClassFilter() {
  var buttons = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll("[data-category]");
  if (!buttons.length || !cards.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      buttons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      var pick = btn.getAttribute("data-filter");
      cards.forEach(function (card) {
        var show = pick === "all" || card.getAttribute("data-category") === pick;
        card.classList.toggle("d-none", !show);
      });
    });
  });
}

// Bootstrap-style validation plus a couple of custom checks.
function setupFormValidation() {
  var forms = document.querySelectorAll(".needs-validation");

  forms.forEach(function (form) {
    // password + confirm password must match on the register form
    var pass = form.querySelector("#password");
    var confirm = form.querySelector("#confirmPassword");
    if (pass && confirm) {
      var checkMatch = function () {
        confirm.setCustomValidity(confirm.value === pass.value ? "" : "Passwords do not match");
      };
      pass.addEventListener("input", checkMatch);
      confirm.addEventListener("input", checkMatch);
    }

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      } else if (form.dataset.demo === "true") {
        // no backend yet, so just show a success message instead of submitting
        e.preventDefault();
        var msg = form.querySelector(".form-success");
        if (msg) msg.classList.remove("d-none");
        form.reset();
        form.classList.remove("was-validated");
        return;
      }
      form.classList.add("was-validated");
    });
  });
}

// Booking page: build a small summary and save the booking on confirm.
function setupBooking() {
  var form = document.getElementById("bookingForm");
  if (!form) return;

  var sessionSelect = document.getElementById("session");
  var dateInput = document.getElementById("bookingDate");
  var timeSelect = document.getElementById("timeBlock");

  // don't allow past dates
  dateInput.min = new Date().toISOString().split("T")[0];

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add("was-validated");
      return;
    }

    var option = sessionSelect.options[sessionSelect.selectedIndex];
    var booking = {
      id: "OM-" + Math.floor(1000 + Math.random() * 9000),
      session: option.text,
      price: option.getAttribute("data-price"),
      date: dateInput.value,
      time: timeSelect.value,
      status: "Confirmed"
    };

    saveBooking(booking);

    // fill and show the confirmation modal
    document.getElementById("confirmDetails").textContent =
      booking.session + " on " + booking.date + " at " + booking.time;
    var modal = new bootstrap.Modal(document.getElementById("bookingModal"));
    modal.show();

    form.reset();
    form.classList.remove("was-validated");
  });
}

// Booking storage. Uses localStorage, but falls back to a plain variable if the
// browser blocks it (for example when the page is opened straight from disk).
var memoryBookings = [];
function getBookings() {
  try {
    return JSON.parse(localStorage.getItem("omero.bookings")) || [];
  } catch (e) {
    return memoryBookings;
  }
}
function writeBookings(list) {
  try {
    localStorage.setItem("omero.bookings", JSON.stringify(list));
  } catch (e) {
    memoryBookings = list;
  }
}
function saveBooking(booking) {
  var list = getBookings();
  list.unshift(booking);
  writeBookings(list);
}
function cancelBooking(id) {
  writeBookings(getBookings().filter(function (b) { return b.id !== id; }));
}

// Dashboard page: show the bookings saved on this browser.
function renderDashboard() {
  var tbody = document.getElementById("bookingRows");
  var empty = document.getElementById("noBookings");
  if (!tbody) return;

  var list = getBookings();
  tbody.innerHTML = "";

  if (!list.length) {
    if (empty) empty.classList.remove("d-none");
    return;
  }
  if (empty) empty.classList.add("d-none");

  list.forEach(function (b) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td class="res-id">' + b.id + "</td>" +
      "<td>" + b.session + "</td>" +
      "<td>" + b.date + " &middot; " + b.time + "</td>" +
      "<td>LKR " + b.price + "</td>" +
      '<td><span class="badge text-bg-success">' + b.status + "</span></td>" +
      '<td class="text-end"><button class="btn btn-sm btn-outline-light" data-cancel="' + b.id + '">Cancel</button></td>';
    tbody.appendChild(tr);
  });

  // cancel buttons
  tbody.querySelectorAll("[data-cancel]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      cancelBooking(btn.getAttribute("data-cancel"));
      renderDashboard();
    });
  });
}
