
export function arrayBufferToString(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}