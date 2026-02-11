const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { buildNav } = require("../lib/nav");

const router = express.Router();

router.get("/", (req, res) => res.redirect("/dashboard"));

router.get("/dashboard", requireAuth, (req, res) => {
  const user = req.session.user;
  const nav = buildNav(user, "/dashboard");

  res.render("dashboard", {
    title: "Dashboard",
    subtitle: "Bestellsystem",
    nav,
    userLabel: user.label,
    role: user.role
  });
});

// Orders list (placeholder)
router.get("/orders", requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const user = req.session.user;

  const nav = buildNav(user, "/orders");

  const orders = db
    .prepare(
      `SELECT id, status, customer_label, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 50`
    )
    .all(user.id);

  res.render("orders", {
    title: "Meine Bestellungen",
    subtitle: "Bestellsystem",
    nav,
    userLabel: user.label,
    orders
  });
});

router.get("/orders/new", requireAuth, (req, res) => {
  const user = req.session.user;
  const nav = buildNav(user, "/orders/new");

  res.render("order_new", {
    title: "Neue Bestellung",
    subtitle: "Bestellsystem",
    nav,
    userLabel: user.label,
    error: null
  });
});

router.post("/orders/new", requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const user = req.session.user;

  const notes = (req.body.notes || "").trim();
  if (notes.length < 3) {
    const nav = buildNav(user, "/orders/new");
    return res.render("order_new", {
      title: "Neue Bestellung",
      subtitle: "Bestellsystem",
      nav,
      userLabel: user.label,
      error: "Bitte gib eine kurze Notiz zur Bestellung ein (mindestens 3 Zeichen)."
    });
  }

  const customerType = user.role === "b2b" ? "b2b" : "branch";

  db.prepare(
    `INSERT INTO orders (user_id, customer_type, customer_label, status, notes)
     VALUES (?, ?, ?, 'offen', ?)`
  ).run(user.id, customerType, user.label, notes);

  res.redirect("/orders");
});

module.exports = router;
