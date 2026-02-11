const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("login", {
    title: "Login",
    subtitle: "Bestellsystem",
    nav: [],
    userLabel: null,
    error: null
  });
});

router.post("/login", (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  const user = db
    .prepare("SELECT id, username, password_hash, role, label FROM users WHERE username = ?")
    .get(username);

  if (!user) {
    return res.render("login", {
      title: "Login",
      subtitle: "Bestellsystem",
      nav: [],
      userLabel: null,
      error: "Benutzername oder Passwort ist falsch."
    });
  }

  const ok = bcrypt.compareSync(password || "", user.password_hash);
  if (!ok) {
    return res.render("login", {
      title: "Login",
      subtitle: "Bestellsystem",
      nav: [],
      userLabel: null,
      error: "Benutzername oder Passwort ist falsch."
    });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    label: user.label || user.username
  };

  res.redirect("/dashboard");
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
