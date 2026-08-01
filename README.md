# OMERO GYM

A gym booking web application built for **ICT 1209 – Web Technologies** (mini project).
Members can browse classes and training sessions, reserve a slot by date and time,
and view their bookings on a personal dashboard.

**Theme:** Fitness &amp; Gym Management

## Group Members

| Name | Index Number |
|------|--------------|
| _[ Member 1 name ]_ | _[ index no ]_ |
| _[ Member 2 name ]_ | _[ index no ]_ |

## Features

- Responsive multi-page site (works on mobile, tablet and desktop)
- Class and session catalog with live category filtering
- Slot booking with a confirmation modal (saved in the browser for now)
- Personal dashboard listing booked slots, with cancel
- Login, registration and contact forms with real-time validation

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5, CSS3, Bootstrap 5 |
| Styling | Custom CSS on top of Bootstrap (dark theme) |
| Logic | JavaScript (Vanilla) |
| Backend | PHP 8 *(added in Phase 3)* |
| Database | MySQL *(added in Phase 3)* |
| Version control | Git &amp; GitHub |

## Pages

| File | Description |
|------|-------------|
| `index.html` | Home page with hero, image carousel and features |
| `classes.html` | Class catalog with category filter |
| `book.html` | Booking form with confirmation modal |
| `dashboard.html` | List of the member's bookings |
| `login.html` | Login form |
| `register.html` | Account creation form |
| `contact.html` | Contact / enquiry form |

## JavaScript Features

1. **Dynamic content** – filter class cards by category without reloading.
2. **Image slider** – Bootstrap carousel on the home page.
3. **Form validation** – required fields, email format, matching passwords and live feedback.
4. **Smooth scrolling** – navigation links scroll smoothly to page sections.
5. **Custom animation** – sections fade in as you scroll.
6. **Event handling** – navbar shadow on scroll, booking and cancel actions.

## Folder Structure

```
GYM-Website/
├── css/
│   └── style.css
├── js/
│   └── main.js
├── images/
│   ├── slide1.svg
│   ├── slide2.svg
│   ├── slide3.svg
│   └── favicon.svg
├── index.html
├── classes.html
├── book.html
├── dashboard.html
├── login.html
├── register.html
├── contact.html
└── README.md
```

## How to Run

This phase is front-end only, so no server is required.

1. Clone the repository:
   ```
   git clone https://github.com/Mhd-Ashfak/GYM-Website.git
   ```
2. Open the folder in your editor.
3. Open `index.html` in a browser, or use the **Live Server** extension in VS Code
   (recommended, so booking data is kept between pages).

Bootstrap 5 and the icons/fonts load from a CDN, so an internet connection is needed
the first time.

## Roadmap (Phase 3)

- PHP 8 backend with user registration, login and logout
- MySQL database (`users`, `messages`, `bookings`) via XAMPP
- Passwords hashed with `password_hash()` and prepared statements for all queries
