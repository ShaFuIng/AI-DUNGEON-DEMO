const fs = require("fs");
const path = require("path");
const { parseGeneratedJson } = require("./parseGeneratedJson");

const samplePath =
  process.argv[2] ||
  path.join(__dirname, "..", "samples", "badEscapedJson.sample.txt");
const rawText = fs.readFileSync(samplePath, "utf8");
const parsed = parseGeneratedJson(rawText, "bad escaped JSON sample");

console.log("parseGeneratedJson PASS");
console.log(JSON.stringify(parsed, null, 2));
