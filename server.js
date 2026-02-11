require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const morgan = require("morgan");

const { openDb, migrate } = require("./db");

const authRoutes = require("./src/routes/auth");
const appRoutes = require("./src/routes/app");
const adminRoutes = require("./src/routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

const db = openDb();
migrate(db);

// Make db available in req
app.locals.db = db;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
  })
);

// Attach user to res.locals for views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.use("/", authRoutes);
app.use("/", appRoutes);
app.use("/admin", adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
