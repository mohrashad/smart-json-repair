import { Token } from "../types";
import { isDigit, isWhitespace, isWordChar } from "./charUtils";

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
    const ch = input[i];

    if (isWhitespace(ch)) { i++; continue; }

    if (ch === '/') {
      if (i + 1 < n && input[i + 1] === '/') {
        i += 2;
        while (i < n && input[i] !== '\n' && input[i] !== '\r') i++;
        continue;
      } else if (i + 1 < n && input[i + 1] === '*') {
        i += 2;
        while (i < n) {
          if (input[i] === '*' && i + 1 < n && input[i + 1] === '/') {
            i += 2;
            break;
          }
          i++;
        }
        continue;
      }
    }

    if (ch === "{") { tokens.push({ type: "brace_open", pos: i }); i++; continue; }
    if (ch === "}") { tokens.push({ type: "brace_close", pos: i }); i++; continue; }
    if (ch === "[") { tokens.push({ type: "bracket_open", pos: i }); i++; continue; }
    if (ch === "]") { tokens.push({ type: "bracket_close", pos: i }); i++; continue; }
    if (ch === ":") { tokens.push({ type: "colon", pos: i }); i++; continue; }
    if (ch === ",") { tokens.push({ type: "comma", pos: i }); i++; continue; }

    // String parsing (after preprocessing, quotes should be cleaner)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let val = "";
      let escaped = false;
      let closed = false;
      
      while (j < n) {
        let c = input[j];
        
        if (escaped) {
          if (c === 'n') val += '\n';
          else if (c === 't') val += '\t';
          else if (c === 'r') val += '\r';
          else if (c === 'b') val += '\b';
          else if (c === 'f') val += '\f';
          else if (c === '\\') val += '\\';
          else if (c === '"') val += '"';
          else if (c === '\'') val += '\'';
          else if (c === '/') val += '/';
          else if (c === 'u') {
            let hex = '';
            for (let k = 0; k < 4; k++) {
              j++;
              if (j < n) hex += input[j];
              else break;
            }
            if (hex.length === 4 && /^[0-9a-fA-F]{4}$/i.test(hex)) {
              val += String.fromCharCode(parseInt(hex, 16));
            } else {
              val += '\\u' + hex;
            }
          } else {
            val += c; // Don't keep the backslash for most invalid escapes
          }
          escaped = false;
          j++;
          continue;
        }
        
        if (c === "\\") {
          escaped = true;
          j++;
          continue;
        }
        
        if (c === quote) {
          closed = true;
          j++;
          break;
        }
        
        val += c;
        j++;
      }
      
      tokens.push({ type: "string", value: val, pos: i });
      i = j;
      continue;
    }

    // numbers
    if (isDigit(ch) || (ch === "-" && isDigit(input[i + 1] || ""))) {
      let j = i;
      let s = "";
      if (input[j] === "-") { s += "-"; j++; }
      while (j < n && isDigit(input[j])) { s += input[j]; j++; }
      if (input[j] === ".") {
        s += "."; j++;
        while (j < n && isDigit(input[j])) { s += input[j]; j++; }
      }
      if (input[j] === "e" || input[j] === "E") {
        s += input[j]; j++;
        if (input[j] === "+" || input[j] === "-") { s += input[j]; j++; }
        while (j < n && isDigit(input[j])) { s += input[j]; j++; }
      }
      tokens.push({ type: "number", value: s, pos: i });
      i = j;
      continue;
    }

    // words (unquoted keys or bare words like true/false/null or identifiers)
    if (isWordChar(ch) || ch === ".") {
      let j = i;
      let s = "";
      
      // Read until we hit a structural character
      while (j < n) {
        const c = input[j];
        
        // Stop at structural chars
        if (["{", "}", "[", "]", ":", ",", '"', "'"].includes(c)) {
          break;
        }
        
        s += c;
        j++;
      }
      
      // Trim and clean up
      s = s.trim().replace(/^[\s,]+|[\s,]+$/g, "");
      
      if (s) tokens.push({ type: "word", value: s, pos: i });
      i = j;
      continue;
    }

    i++;
  }

  tokens.push({ type: "eof", pos: i });
  return tokens;
}