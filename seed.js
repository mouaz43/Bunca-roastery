require("dotenv").config();
const bcrypt = require("bcryptjs");
const { openDb, migrate } = require("./db");

function main() {
  const db = openDb();
  migrate(db);

  const countUsers = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;

  if (countUsers > 0) {
    console.log("Seed skipped: users already exist.");
    return;
  }

  const insert = db.prepare(`
    INSERT INTO users (username, password_hash, role, label)
    VALUES (?, ?, ?, ?)
  `);

  const users = [
    { username: "admin", password: "admin123", role: "admin", label: "Rösterei Admin" },
    { username: "filiale1", password: "branch123", role: "branch", label: "Filiale 1" },
    { username: "b2b1", password: "b2b123", role: "b2b", label: "B2B Kunde 1" }
  ];

  const tx = db.transaction(() => {
    for (const u of users) {
      const hash = bcrypt.hashSync(u.password, 10);
      insert.run(u.username, hash, u.role, u.label);
    }
  });

  tx();

  console.log("Seed complete.");
  console.log("Logins:");
  console.log("admin / admin123");
  console.log("filiale1 / branch123");
  console.log("b2b1 / b2b123");
}

main();
