
export function arrayBufferToString(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

export function truncateString(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + "..." : str;
}