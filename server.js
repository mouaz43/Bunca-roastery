// server.js
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Needed for __dirname with ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Express basics ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files (your /public/styles.css)
app.use(express.static(path.join(__dirname, "public")));

// --- Sessions ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 10, // 10h
    },
  })
);

// --- View engine (EJS) ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Helper: build nav based on role
function buildNav(req) {
  const role = req.session.user?.role;

  const base = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/orders/new", label: "Neue Bestellung", icon: "🧾" },
    { href: "/orders", label: "Meine Bestellungen", icon: "📦" },
    { href: "/stock", label: "Lagerbestand", icon: "📊" },
  ];

  const admin = [
    { href: "/admin", label: "Admin Dashboard", icon: "🛠️" },
    { href: "/admin/orders", label: "Alle Bestellungen", icon: "📚" },
    { href: "/admin/production", label: "Produktion", icon: "🔥" },
    { href: "/admin/coffees", label: "Kaffeesorten", icon: "☕" },
    { href: "/admin/inventory", label: "Lagerverwaltung", icon: "🏭" },
    { href: "/admin/users", label: "Benutzer", icon: "👥" },
  ];

  const items = role === "admin" ? [...base, ...admin] : base;

  // mark active
  return items.map((i) => ({
    ...i,
    active: req.path === i.href || req.path.startsWith(i.href + "/"),
  }));
}

// Middleware: require login
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Middleware: require admin
function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  if (req.session.user.role !== "admin") return res.status(403).send("Forbidden");
  next();
}

// --- Routes ---
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

// Demo login (replace with DB later)
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // TODO: replace with real DB lookup + hashed passwords
  const USERS = [
    { username: "admin", password: "admin123", role: "admin", label: "Admin (Rösterei)" },
    { username: "filiale1", password: "test123", role: "branch", label: "Filiale 1" },
    { username: "b2b1", password: "test123", role: "b2b", label: "B2B Kunde 1" },
  ];

  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).render("login", {
      title: "Login",
      subtitle: "Bestellsystem",
      nav: [],
      userLabel: null,
      error: "Login fehlgeschlagen. Bitte prüfen.",
    });
  }

  req.session.user = { username: user.username, role: user.role, label: user.label };
  res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    subtitle: "Bestellsystem",
    nav: buildNav(req),
    userLabel: req.session.user.label,
  });
});

// Placeholders so your menu links don’t 404
app.get("/orders", requireAuth, (req, res) => res.send("TODO: Meine Bestellungen"));
app.get("/orders/new", requireAuth, (req, res) => res.send("TODO: Neue Bestellung"));
app.get("/stock", requireAuth, (req, res) => res.send("TODO: Lagerbestand"));

app.get("/admin", requireAdmin, (req, res) => {
  res.render("admin/dashboard", {
    title: "Admin Dashboard",
    subtitle: "Rösterei",
    nav: buildNav(req),
    userLabel: req.session.user.label,
  });
});

app.get("/admin/orders", requireAdmin, (req, res) => res.send("TODO: Admin Bestellungen"));
app.get("/admin/production", requireAdmin, (req, res) => res.send("TODO: Produktion"));
app.get("/admin/coffees", requireAdmin, (req, res) => res.send("TODO: Kaffeesorten"));
app.get("/admin/inventory", requireAdmin, (req, res) => res.send("TODO: Lagerverwaltung"));
app.get("/admin/users", requireAdmin, (req, res) => res.send("TODO: Benutzerverwaltung"));

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
