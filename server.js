// server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
  })
);

// Make user available in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// --- auth helpers ---
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.role !== role) return res.status(403).send("Forbidden");
    next();
  };
}

function navFor(user, activePath = "") {
  if (!user) return [];
  const common = [{ href: "/dashboard", label: "Dashboard", icon: "🏠" }];
  if (user.role === "admin") {
    return [
      { href: "/admin", label: "Admin", icon: "🛠️", active: activePath.startsWith("/admin") },
      { href: "/admin/orders", label: "Bestellungen", icon: "📦", active: activePath === "/admin/orders" },
      { href: "/admin/production", label: "Produktion", icon: "🔥", active: activePath === "/admin/production" },
      { href: "/admin/products", label: "Kaffeesorten", icon: "☕", active: activePath === "/admin/products" },
    ];
  }
  return [
    ...common.map(i => ({ ...i, active: activePath === i.href })),
    { href: "/orders/new", label: "Neue Bestellung", icon: "➕", active: activePath === "/orders/new" },
    { href: "/orders", label: "Meine Bestellungen", icon: "📄", active: activePath === "/orders" },
  ];
}

// --- seed admin (only if no users exist) ---
(function seed() {
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  if (count === 0) {
    const pw = process.env.SEED_ADMIN_PASSWORD || "admin123";
    const hash = bcrypt.hashSync(pw, 10);
    db.prepare(
      "INSERT INTO users (username, password_hash, role, label) VALUES (?,?,?,?)"
    ).run("admin", hash, "admin", "Admin");
    console.log("Seeded admin user: admin /", pw);
  }
})();

// --- routes ---
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
    subtitle: "Bestellsystem",
    nav: [],
    userLabel: null,
    error: null,
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.render("login", {
      title: "Login",
      subtitle: "Bestellsystem",
      nav: [],
      userLabel: null,
      error: "Login fehlgeschlagen. Bitte prüfen.",
    });
  }

  req.session.user = { id: user.id, role: user.role, label: user.label || user.username };
  res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.get("/dashboard", requireAuth, (req, res) => {
  const user = req.session.user;
  res.render("dashboard", {
    title: "Dashboard",
    subtitle: user.role === "admin" ? "Rösterei Admin" : "Benutzerbereich",
    nav: navFor(user, "/dashboard"),
    userLabel: user.label,
  });
});

// --- orders (branch/b2b) ---
app.get("/orders", requireAuth, (req, res) => {
  const user = req.session.user;
  if (user.role === "admin") return res.redirect("/admin/orders");

  const orders = db
    .prepare("SELECT * FROM orders WHERE created_by=? ORDER BY id DESC")
    .all(user.id);

  res.render("orders/index", {
    title: "Meine Bestellungen",
    subtitle: "Übersicht",
    nav: navFor(user, "/orders"),
    userLabel: user.label,
    orders,
  });
});

app.get("/orders/new", requireAuth, (req, res) => {
  const user = req.session.user;
  if (user.role === "admin") return res.redirect("/admin/orders");

  res.render("orders/new", {
    title: "Neue Bestellung",
    subtitle: "Bestellung anlegen",
    nav: navFor(user, "/orders/new"),
    userLabel: user.label,
    error: null,
  });
});

app.post("/orders/new", requireAuth, (req, res) => {
  const user = req.session.user;
  const { product, size, qty, notes } = req.body;

  if (!product || !size || !qty) {
    return res.render("orders/new", {
      title: "Neue Bestellung",
      subtitle: "Bestellung anlegen",
      nav: navFor(user, "/orders/new"),
      userLabel: user.label,
      error: "Bitte Produkt, Größe und Menge ausfüllen.",
    });
  }

  const insertOrder = db.prepare(
    "INSERT INTO orders (created_by, customer_label, notes) VALUES (?,?,?)"
  );
  const insertItem = db.prepare(
    "INSERT INTO order_items (order_id, product, size, qty) VALUES (?,?,?,?)"
  );

  const tx = db.transaction(() => {
    const info = insertOrder.run(user.id, user.label, notes || null);
    insertItem.run(info.lastInsertRowid, product, size, parseInt(qty, 10));
  });

  tx();
  res.redirect("/orders");
});

// --- admin ---
app.get("/admin", requireRole("admin"), (req, res) => {
  const user = req.session.user;
  res.render("admin/dashboard", {
    title: "Admin Dashboard",
    subtitle: "Rösterei",
    nav: navFor(user, "/admin"),
    userLabel: user.label,
  });
});

app.get("/admin/orders", requireRole("admin"), (req, res) => {
  const user = req.session.user;
  const orders = db
    .prepare("SELECT * FROM orders ORDER BY id DESC")
    .all();

  res.render("admin/orders", {
    title: "Bestellungen",
    subtitle: "Alle Bestellungen",
    nav: navFor(user, "/admin/orders"),
    userLabel: user.label,
    orders,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
