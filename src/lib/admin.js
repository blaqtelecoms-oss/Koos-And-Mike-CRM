// Accounts treated as administrators. The dashboard has always recognised these
// addresses, so the sidebar uses the same rule for its Admin Only links.
const ADMIN_EMAILS = ["deon", "heino", "blaqtelecoms@gmail.com"];

export function isAdminUser(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const email = (user.email || "").toLowerCase();
  return ADMIN_EMAILS.some((a) => email.includes(a));
}
