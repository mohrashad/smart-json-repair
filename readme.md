# 🔧 Smart JSON Repair

[![npm version](https://badge.fury.io/js/smart-json-repair.svg)](https://www.npmjs.com/package/smart-json-repair)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Smart JSON Repair** is an intelligent JSON repair tool that automatically fixes broken, malformed, or incomplete JSON with advanced heuristics. It handles a wide range of JSON syntax errors and recovers valid JSON from messy input.

## ✨ Features

- 🔍 **Automatic Quote Fixing**: Handles missing, mismatched, or broken quotes
- 📝 **Unquoted Keys & Values**: Converts unquoted identifiers to proper strings
- 🔗 **Missing Commas**: Intelligently inserts missing commas between elements
- 🧩 **Incomplete Structures**: Closes unclosed brackets and braces
- 🎯 **Type Inference**: Converts boolean/null variants (TRUE, None, nil, etc.)
- 🌐 **Unicode Handling**: Fixes broken unicode escape sequences
- 💬 **Comment Removal**: Strips JavaScript-style comments (`//` and `/* */`)
- 🔢 **Number Parsing**: Handles various number formats and edge cases
- 📦 **Nested Structures**: Properly repairs deeply nested objects and arrays
- 🚀 **CLI & Programmatic API**: Use as a command-line tool or import as a library

## 📦 Installation

### Global Installation (CLI)

```bash
npm install -g json-smart-repair
```

### Local Installation (Library)

```bash
npm install json-smart-repair

```

## 🚀 Usage

### Command Line Interface (CLI)

#### From File

```bash
json-repair input.json > output.json
```

#### From stdin

```bash
echo '{ id: 1, name: "John" age: 30 }' | json-repair
```

#### Using pipe

```bash
cat broken.json | json-repair > fixed.json
```

### Programmatic API

#### JavaScript/Node.js

```javascript
const { repairJson } = require('json-smart-repair');

const brokenJson = `{
  id: 1,
  name: "John Doe",
  age: 30,
  active: TRUE,
  tags: ["developer" "nodejs"],
}`;

const fixedJson = repairJson(brokenJson);
console.log(fixedJson);
```

#### TypeScript

```typescript
import { repairJson } from 'json-smart-repair';

const brokenJson = `{ id: 1, name: 'Alice', city: Cairo }`;
const fixedJson = repairJson(brokenJson);

// Parse the repaired JSON
const data = JSON.parse(fixedJson);
console.log(data);
```

## 🎯 Examples

### Example 1: Missing Commas & Unquoted Keys

**Input:**
```json
{ id: 1 name: "Alice" city: "Cairo" }
```

**Output:**
```json
{
  "id": 1,
  "name": "Alice",
  "city": "Cairo"
}
```

### Example 2: Broken Quotes

**Input:**
```json
{ "name": "John "The King"", "age": 25 }
```

**Output:**
```json
{
  "name": "John \"The King\"",
  "age": 25
}
```

### Example 3: Arrays with Missing Commas

**Input:**
```json
["apple" "banana" "orange"]
```

**Output:**
```json
[
  "apple",
  "banana",
  "orange"
]
```

### Example 4: Boolean & Null Variants

**Input:**
```json
{
  "active": TRUE,
  "verified": Yes,
  "deleted": None,
  "archived": nullish
}
```

**Output:**
```json
{
  "active": true,
  "verified": true,
  "deleted": null,
  "archived": null
}
```

### Example 5: Trailing Commas

**Input:**
```json
{
  "items": [1, 2, 3,,,],
  "name": "test",
}
```

**Output:**
```json
{
  "items": [
    1,
    2,
    3
  ],
  "name": "test"
}
```

### Example 6: Comments

**Input:**
```json
{
  // This is a comment
  "id": 1,
  /* Multi-line
     comment */
  "name": "John"
}
```

**Output:**
```json
{
  "id": 1,
  "name": "John"
}
```

### Example 7: Complex Nested Structure

**Input:**
```json
[
  { id: 1, name: "Alice", tags: ["dev" "senior"], active: Yes },
  { id: 2, name: Bob, city: "NYC" age: 30 },
  { id: 3 skills: { js: true python: TRUE } }
]
```

**Output:**
```json
[
  {
    "id": 1,
    "name": "Alice",
    "tags": [
      "dev",
      "senior"
    ],
    "active": true
  },
  {
    "id": 2,
    "name": "Bob",
    "city": "NYC",
    "age": 30
  },
  {
    "id": 3,
    "skills": {
      "js": true,
      "python": true
    }
  }
]
```

## 🛠️ API Reference

### `repairJson(text: string): string`

Repairs broken JSON and returns a valid JSON string.

**Parameters:**
- `text` (string): The broken/malformed JSON string

**Returns:**
- (string): Valid, formatted JSON string

**Example:**
```typescript
import { repairJson } from 'json-smart-repair';

const fixed = repairJson('{ name: John, age: 30 }');
// Returns: '{\n  "name": "John",\n  "age": 30\n}'
```

## 🎨 Supported Repairs

| Issue | Example Input | Repaired Output |
|-------|---------------|-----------------|
| Missing quotes | `{name: John}` | `{"name": "John"}` |
| Single quotes | `{'name': 'John'}` | `{"name": "John"}` |
| Missing commas | `{a: 1 b: 2}` | `{"a": 1, "b": 2}` |
| Trailing commas | `[1, 2, 3,]` | `[1, 2, 3]` |
| Unclosed brackets | `{a: [1, 2}` | `{"a": [1, 2]}` |
| Line breaks in strings | `"hello\nworld"` | `"hello\nworld"` |
| Boolean variants | `TRUE`, `Yes` | `true` |
| Null variants | `None`, `nil` | `null` |
| Comments | `// comment` | *(removed)* |
| Broken unicode | `\uD83D` | *(removed)* |

## ⚙️ How It Works

Smart JSON Repair uses a multi-stage approach:

1. **Preprocessing**: Fixes quote issues and detects unclosed strings
2. **Tokenization**: Breaks input into tokens (strings, numbers, brackets, etc.)
3. **Parsing**: Builds JSON structure with error recovery
4. **Post-processing**: Cleans up unicode issues and validates output

The parser uses intelligent heuristics to guess the developer's intent, such as:
- Detecting when a quote should close based on context
- Inferring missing commas from structural patterns
- Recognizing boolean/null value variants
- Handling mixed quoted and unquoted values

## 📋 Requirements

- Node.js >= 14.0.0

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need to handle malformed JSON from various sources
- Built with TypeScript for type safety and better developer experience

## 📞 Support

If you have any questions or need help, please:
- Open an issue on [GitHub](https://github.com/mohrashad/smart-json-repair/issues)
- Check the [documentation](https://github.com/mohrashad/smart-json-repair#readme)

## 🔮 Roadmap

- [ ] Add more test cases
- [ ] Support for JSON5 features
- [ ] Web-based playground
- [ ] VS Code extension
- [ ] Performance optimizations

---

Made with ❤️ by Mohamed Rashad
