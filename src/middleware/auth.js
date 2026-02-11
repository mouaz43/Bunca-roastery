function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    const user = req.session.user;
    if (!user) return res.redirect("/login");
    if (!allowed.includes(user.role)) return res.status(403).send("Forbidden");
    next();
  };
}

module.exports = { requireAuth, requireRole };
