function buildNav(user, currentPath) {
  if (!user) return [];

  const isAdmin = user.role === "admin";

  const base = [
    { href: "/dashboard", label: "Dashboard", icon: "D", active: currentPath === "/dashboard" },
    { href: "/orders/new", label: "Neue Bestellung", icon: "N", active: currentPath === "/orders/new" },
    { href: "/orders", label: "Meine Bestellungen", icon: "B", active: currentPath === "/orders" }
  ];

  const admin = [
    { href: "/admin", label: "Admin Dashboard", icon: "A", active: currentPath === "/admin" }
  ];

  return isAdmin ? base.concat(admin) : base;
}

module.exports = { buildNav };
