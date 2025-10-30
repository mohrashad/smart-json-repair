export function isWhitespace(ch: string) {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

export function isDigit(ch: string) {
  return ch >= "0" && ch <= "9";
}

export function isWordChar(ch: string) {
  return /[A-Za-z_\-]/.test(ch);
}