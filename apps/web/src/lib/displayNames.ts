/** Presentation of imported section records; keep the original values in storage. */
export function courseName(name: string) {
  return name.replace(/\s*\(pitch demo\)/gi, '').replace(/^Illustrative\s+/i, '').trim();
}
export function accountName(name: string, isSeeded: boolean) {
  return isSeeded ? name.replace(/^Demo\s+/i, '').trim() : name;
}
