const express = require("express");
const { requireRole } = require("../middleware/auth");
const { buildNav } = require("../lib/nav");

const router = express.Router();

router.get("/", requireRole("admin"), (req, res) => {
  const db = req.app.locals.db;
  const user = req.session.user;
  const nav = buildNav(user, "/admin");

  const stats = {
    totalOrders: db.prepare("SELECT COUNT(*) AS c FROM orders").get().c,
    openOrders: db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'offen'").get().c,
    inWorkOrders: db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'in_arbeit'").get().c
  };

  const latest = db
    .prepare(
      `SELECT id, status, customer_type, customer_label, created_at
       FROM orders
       ORDER BY id DESC
       LIMIT 20`
    )
    .all();

  res.render("admin/dashboard", {
    title: "Admin Dashboard",
    subtitle: "Rösterei",
    nav,
    userLabel: user.label,
    stats,
    latest
  });
});

module.exports = router;
