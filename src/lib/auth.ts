const STORAGE_KEY = "fc_auth_student_id";

export function getLoggedInStudentId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function loginStudent(studentId: string, _pin: string): boolean {
  const trimmed = studentId.trim();
  if (!trimmed) return false;
  // Pin is required but any value is accepted — this is a research study,
  // not a security boundary. The pin exists to make students feel accountable.
  if (!_pin.trim()) return false;
  try {
    localStorage.setItem(STORAGE_KEY, trimmed);
    return true;
  } catch {
    return false;
  }
}

export function logoutStudent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isAdminMode(): boolean {
  try {
    return localStorage.getItem("fc_admin_mode") === "true";
  } catch {
    return false;
  }
}

export function setAdminMode(on: boolean): void {
  try {
    if (on) localStorage.setItem("fc_admin_mode", "true");
    else localStorage.removeItem("fc_admin_mode");
  } catch {
    // ignore
  }
}
