#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { repairJson } from "./repair-engine";

// Utility: read from stdin
function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

async function main() {
  const args = process.argv.slice(2);
  const inputArg = args[0];

  // Handle version flag
  if (args.includes("--version") || args.includes("-v")) {
    const pkgPath = path.resolve(__dirname, "../package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    console.log(`json-smart-repair v${pkg.version}`);
    process.exit(0);
  }

  // Handle help flag
  if (args.includes("--help") || args.includes("-h") || !inputArg) {
    console.log(`
JSON Smart Repair 🧩
---------------------
Usage:
  json-smart-repair <input-file> [options]
  cat broken.json | json-smart-repair > fixed.json
  echo '{ id: 1, name: "John" age: 30 }' | json-smart-repair

Options:
  -o, --output <file>     Write output to file instead of stdout
  -s, --silent            Suppress warnings
  -v, --version           Show CLI version
  -h, --help              Show this help message
`);
    process.exit(0);
  }

  // Determine input source
  let input = "";
  if (inputArg === "-") {
    input = await readStdin();
  } else {
    try {
      input = fs.readFileSync(inputArg, "utf8");
    } catch (err) {
      console.error(`❌ Cannot read file: ${inputArg}`);
      process.exit(2);
    }
  }

  if (!input || input.trim() === "") {
    console.error("⚠️ No input provided. Provide a file or pipe JSON via stdin.");
    process.exit(1);
  }

  // Repair JSON
  let repaired = "";
  try {
    repaired = repairJson(input);
  } catch (err) {
    console.error("❌ Failed to repair JSON:", (err as Error).message);
    process.exit(3);
  }

  // Try to prettify if valid
  let outputText = repaired;
  try {
    const parsed = JSON.parse(repaired);
    outputText = JSON.stringify(parsed, null, 2);
  } catch {
    if (!args.includes("--silent") && !args.includes("-s")) {
      console.warn("⚠️ Warning: output may still not be valid JSON.");
    }
  }

  // Output
  const outputIndex = args.findIndex((a) => a === "-o" || a === "--output");
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    const outFile = args[outputIndex + 1];
    try {
      fs.writeFileSync(outFile, outputText, "utf8");
      console.log(`✅ Fixed JSON written to ${outFile}`);
    } catch (err) {
      console.error(`❌ Failed to write output file: ${(err as Error).message}`);
      process.exit(4);
    }
  } else {
    process.stdout.write(outputText);
  }
}

// Only run if called directly from CLI
if (require.main === module) {
  main().catch((err) => {
    console.error("💥 Fatal error:", err);
    process.exit(1);
  });
}

// Export for programmatic use
export { repairJson };
