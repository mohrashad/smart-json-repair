import { isWhitespace, isWordChar } from "./charUtils";

/**
 * Pre-process to fix common quote issues
 */
export function preprocessInput(input: string): string {
  let result = '';
  let i = 0;
  const n = input.length;
  let bracketDepth = 0; // Track if we're inside an array
  
  while (i < n) {
    const ch = input[i];
    
    // Track array depth
    if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth--;
    
    // Handle quoted strings more carefully
    if (ch === '"') {
      result += ch;
      i++;
      let inString = true;
      let escaped = false;
      let stringStart = i;
      
      while (i < n && inString) {
        const c = input[i];
        
        if (escaped) {
          result += c;
          escaped = false;
          i++;
          continue;
        }
        
        if (c === '\\') {
          result += c;
          escaped = true;
          i++;
          continue;
        }
        
        if (c === '"') {
          // Check what comes after this quote
          let j = i + 1;
          while (j < n && isWhitespace(input[j])) j++;
          
          if (j >= n) {
            // End of input
            result += c;
            i++;
            inString = false;
            break;
          }
          
          const next = input[j];
          
          // Proper closing: followed by , : ] } or another "
          if ([',', ':', ']', '}'].includes(next)) {
            result += c;
            i++;
            inString = false;
            break;
          }
          
          // Check for pattern like: " "key" or " word (unquoted)
          if (next === '"') {
            // Peek further to see if it's a new key
            let k = j + 1;
            let hasWord = false;
            while (k < n && input[k] !== '"' && input[k] !== ':' && input[k] !== ',' && !isWhitespace(input[k])) {
              hasWord = true;
              k++;
            }
            // If we find : after the word, it's likely a key, so close current string
            while (k < n && isWhitespace(input[k])) k++;
            if (k < n && input[k] === '"') k++;
            while (k < n && isWhitespace(input[k])) k++;
            
            if (hasWord && k < n && input[k] === ':') {
              result += c;
              i++;
              inString = false;
              break;
            }
          }
          // Check for pattern like: " word (unquoted key/value follows)
          else if (isWordChar(next) || next === '_') {
            // Look further to see if this is a key or array element
            let k = j;
            let word = '';
            while (k < n && (isWordChar(input[k]) || input[k] === '_')) {
              word += input[k];
              k++;
            }
            while (k < n && isWhitespace(input[k])) k++;
            
            // If followed by :, it's a key, close string
            if (k < n && input[k] === ':') {
              result += c;
              i++;
              inString = false;
              break;
            }
            // If we're in an array and followed by , or ], it's an array element
            else if (bracketDepth > 0 && (k >= n || input[k] === ',' || input[k] === ']' || input[k] === '}')) {
              result += c;
              i++;
              inString = false;
              break;
            }
          }
          
          // Otherwise escape it (it's part of content)
          result += '\\"';
          i++;
          continue;
        }
        
        // Check if we hit structural chars that should close the string
        if ((c === ',' || c === '}' || c === ']') && !escaped) {
          // Look ahead to see if next thing looks like a new JSON element
          let j = i + 1;
          while (j < n && isWhitespace(input[j])) j++;
          
          let shouldClose = false;
          
          // If we hit } or ], likely end of object/array
          if (c === '}' || c === ']') {
            shouldClose = true;
          }
          // If next is { or [ after comma, new object/array
          else if (j < n && (input[j] === '{' || input[j] === '[')) {
            shouldClose = true;
          }
          // If next is " followed by word and :, new key-value pair
          else if (j < n && input[j] === '"') {
            let k = j + 1;
            let hasKey = false;
            while (k < n && input[k] !== '"' && input[k] !== ':' && !isWhitespace(input[k])) {
              hasKey = true;
              k++;
            }
            if (k < n && input[k] === '"') k++;
            while (k < n && isWhitespace(input[k])) k++;
            
            if (hasKey && k < n && input[k] === ':') {
              shouldClose = true;
            }
          }
          
          if (shouldClose) {
            // Close the string before the structural char
            result += '"';
            inString = false;
            break;
          }
        }
        
        result += c;
        i++;
      }
      
      // If string never closed, close it
      if (inString) {
        result += '"';
      }
      
      continue;
    }
    
    result += ch;
    i++;
  }
  
  return result;
}