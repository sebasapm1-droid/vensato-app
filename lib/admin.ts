function readAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? process.env.VENSATO_ADMIN_EMAILS ?? "";

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return readAdminEmails().includes(email.trim().toLowerCase());
}
