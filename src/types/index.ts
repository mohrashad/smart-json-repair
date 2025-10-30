export type TokenType = "brace_open" | "brace_close" | "bracket_open" | "bracket_close" |
  "colon" | "comma" | "string" | "number" | "word" | "eof";

export interface Token {
  type: TokenType;
  value?: string;
  pos: number;
}