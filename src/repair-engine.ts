import {  preprocessInput, tokenize } from "./helpers";
import { Token, TokenType } from "./types";

function repairJsonText(input: string): string {
  const raw = input;
  const tokens = tokenize(input);
  let idx = 0;

  function peek(): Token { return tokens[idx] || { type: "eof", pos: raw.length }; }
  function next(): Token { const t = peek(); idx++; return t; }
  function accept(type: TokenType): Token | null {
    if (peek().type === type) return next();
    return null;
  }

  function parseValue(): any {
    const t = peek();

    if (t.type === "string") {
      next();
      let val = (t.value ?? "").trim();
      // Keep valid emoji pairs, only remove broken surrogates
      // A valid surrogate pair is high surrogate (D800-DBFF) followed by low surrogate (DC00-DFFF)
      // Remove only orphaned surrogates
      val = val.replace(/([\uD800-\uDBFF])(?![\uDC00-\uDFFF])|((?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/g, '');
      return val;
    }

    if (t.type === "number") {
      next();
      const num = Number(t.value);
      return Number.isFinite(num) ? num : t.value;
    }

    if (t.type === "brace_open") return parseObject();
    if (t.type === "bracket_open") return parseArray();

    if (t.type === "word") {
      const raw = (t.value ?? "").trim();
      const low = raw.toLowerCase();
      next();

      if (/^(truee?|yes|on|true)$/i.test(low)) return true;
      if (/^(falsee?|no|off|false)$/i.test(low)) return false;
      if (/^(null|none|nil|undefined|empty|nullish)$/i.test(low)) return null;
      if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
      if (/^[a-zA-Z\u0600-\u06FF\s.,]+$/.test(raw)) return raw;
      if (/^u[0-9A-F]{4}$/i.test(raw)) return String.fromCodePoint(parseInt(raw.slice(1), 16));
      
      return raw;
    }

    if (["colon", "comma"].includes(t.type)) {
      next();
      return "";
    }

    next();
    return "";
  }

  function parseArray(): any[] {
    accept("bracket_open");
    const arr: any[] = [];
    let safety = 0;
    
    while (safety++ < 10000) {
      const p = peek();
      if (p.type === "bracket_close" || p.type === "brace_close") {
        next();
        break;
      }
      if (p.type === "eof") break;
      if (p.type === "comma") { next(); continue; }

      if (p.type === "string" || p.type === "word") {
        const tempIdx = idx;
        next();
        if (peek().type === "colon") {
          idx = tempIdx;
          break;
        }
        idx = tempIdx;
      }

      const v = parseValue();
      
      // Split strings that contain \" \" pattern (missing comma between strings)
      if (typeof v === "string" && v.includes('" "')) {
        const parts = v.split('" "').map(s => s.replace(/^"|"$/g, ''));
        arr.push(...parts);
      } else {
        arr.push(v);
      }

      const after = peek();
      if (after.type === "comma") { next(); continue; }
      if (after.type === "bracket_close" || after.type === "brace_close") { next(); break; }
      if (["string", "number", "word", "brace_open", "bracket_open"].includes(after.type)) {
        continue;
      }
      next();
    }
    return arr;
  }

  function parseObject(): any {
    accept("brace_open");
    const obj: any = {};
    let safety = 0;

    while (safety++ < 10000) {
      const p = peek();

      if (p.type === "brace_close") { next(); break; }
      if (p.type === "eof") break;
      if (p.type === "comma") { next(); continue; }
      if (p.type === "bracket_close") { next(); continue; }
      if (p.type === "brace_open" && Object.keys(obj).length > 0) break;

      let key: string | null = null;

      if (p.type === "string" || p.type === "word") {
        key = (next().value ?? "").trim();
        // Clean up malformed keys - remove leading quotes, brackets, etc
        key = key.replace(/^[,\s\]"\\]+/, '').replace(/[,\s\]"\\]+$/, '');
        if (!key) continue;
      } else {
        while (peek().type !== "comma" && peek().type !== "brace_close" && peek().type !== "eof") next();
        continue;
      }

      if (!accept("colon")) {
        while (peek().type !== "colon" && peek().type !== "comma" && peek().type !== "brace_close" && peek().type !== "eof") next();
        if (!accept("colon")) continue;
      }

      const value = parseValue();
      obj[key] = value;

      if (peek().type === "comma") { next(); continue; }
      if (peek().type === "brace_close") { next(); break; }
    }

    return obj;
  }

  let result: any = null;
  const first = peek();
  
  if (first.type === "bracket_open") {
    result = parseArray();
  } else if (first.type === "brace_open") {
    const items: any[] = [];
    while (peek().type !== "eof") {
      if (peek().type === "brace_open") {
        items.push(parseObject());
        if (peek().type === "comma") next();
        continue;
      }
      items.push(parseValue());
    }
    result = items.length === 1 ? items[0] : items;
  } else {
    const items: any[] = [];
    while (peek().type !== "eof") {
      if (peek().type === "brace_open") {
        items.push(parseObject());
        continue;
      }
      items.push(parseValue());
    }
    result = items.length === 1 ? items[0] : items;
  }

  try {
    return JSON.stringify(result, null, 2);
  } catch {
    let tmp = input;
    const opensObj = (tmp.match(/{/g) || []).length;
    const closesObj = (tmp.match(/}/g) || []).length;
    const opensArr = (tmp.match(/\[/g) || []).length;
    const closesArr = (tmp.match(/]/g) || []).length;
    tmp = tmp + "}".repeat(Math.max(0, opensObj - closesObj)) + "]".repeat(Math.max(0, opensArr - closesArr));
    
    try {
      const parsed = JSON.parse(tmp);
      return JSON.stringify(parsed, null, 2);
    } catch {
      try { 
        return JSON.stringify(result, null, 2); 
      } catch { 
        return 'null'; 
      }
    }
  }
}

export default function repairJson(text: string): string {
  const t = text.trim();
  if (!t) return "null";
  
  let pre = t.replace(/[-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  pre = pre.replace(/\\u([0-9a-fA-F]{0,3})(?![0-9a-fA-F])/g, "\\uFFFD");
  
  // Apply preprocessing to fix quote issues
  pre = preprocessInput(pre);
  
  return repairJsonText(pre);
}