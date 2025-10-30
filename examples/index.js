import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { repairJson } from 'smart-json-repair';

const jsonFiles = [
    '01_missing_commas_input.json',
    '02_unquoted_input.json',
    '03_unclosed_input.json',
    '04_missing_braces_input.json',
    '05_nulls_input.json',
    '06_nested_input.json',
    '07_unicode_input.json',
    '08_multiword_input.json',
    '09_big_mixed_input.json',
    '10_three_examples_input.json',
    '11_five_examples_input.json',
    '12_ten_examples_input.json'
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

jsonFiles.forEach(jsonFile => {
    const inputPath = path.join(__dirname, 'inputs', jsonFile);
    const outputPath = path.join(__dirname, 'outputs', jsonFile);
    const input = fs.readFileSync(inputPath, 'utf8');
    const output = repairJson(input);
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(outputPath)) {
        fs.writeFileSync(outputPath, "", "utf8");
    }


    fs.writeFileSync(outputPath, output, 'utf8');
});
