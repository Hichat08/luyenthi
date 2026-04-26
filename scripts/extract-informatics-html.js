const fs = require("fs");
const path = require("path");
const vm = require("vm");

const [, , inputPathArg, outputPathArg] = process.argv;

if (!inputPathArg || !outputPathArg) {
  console.error("Usage: node scripts/extract-informatics-html.js <input-html> <output-json>");
  process.exit(1);
}

const inputPath = path.resolve(inputPathArg);
const outputPath = path.resolve(outputPathArg);
const source = fs.readFileSync(inputPath, "utf8");

const tryParseHtmlArray = (content) => {
  const match = content.match(/const\s+ALL_QUESTIONS_DATA\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    return null;
  }

  return vm.runInNewContext(match[1]);
};

const tryParseExportedJsonArray = (content) => {
  const match = content.match(/export\s+const\s+\w+\s*=\s*(\[[\s\S]*\]);?\s*$/);
  if (!match) {
    return null;
  }

  return JSON.parse(match[1]);
};

let rawQuestions;

try {
  rawQuestions = tryParseHtmlArray(source);
} catch (error) {
  rawQuestions = null;
}

if (!rawQuestions) {
  try {
    rawQuestions = tryParseExportedJsonArray(source);
  } catch (error) {
    rawQuestions = null;
  }
}

if (!rawQuestions) {
  console.error("Could not parse question bank from the provided source file.");
  process.exit(1);
}

if (!Array.isArray(rawQuestions)) {
  console.error("Extracted data is not an array.");
  process.exit(1);
}

const questions = rawQuestions.map((item, index) => ({
  id: `informatics-${index + 1}`,
  lesson: item.lesson,
  title: item.title,
  question: item.q,
  options: {
    A: item.A,
    B: item.B,
    C: item.C,
    D: item.D,
  },
  correctAnswer: "A",
}));

const lessonSummary = Object.entries(
  questions.reduce((acc, item) => {
    const key = `${item.lesson} - ${item.title}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})
).map(([key, count]) => ({ key, count }));

const payload = {
  sourceFile: inputPath,
  extractedAt: new Date().toISOString(),
  totalQuestions: questions.length,
  note: "Correct answer is set to A because the source HTML marks option A as the original correct option before shuffling display order.",
  lessonSummary,
  questions,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(`Extracted ${questions.length} questions to ${outputPath}`);
