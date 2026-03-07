const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Ensure the API key is available
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_actual_api_key_here') {
  console.error("Error: GEMINI_API_KEY is not set correctly in the .env file.");
  process.exit(1);
}

// Initialize the Google Gen AI SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Exact model requested
const MODEL_NAME = 'gemini-3.1-pro-preview';

// If true, skip PDFs that already have a corresponding .md file in the output folder
const SKIP_EXISTING_FILES = true;

// Delay helper to avoid rate limits
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const inputDir = path.join(__dirname, 'lessons');
  const outputDir = path.join(__dirname, 'output');

  // Ensure input directory exists
  if (!fs.existsSync(inputDir)) {
    console.error(`Error: Input directory '${inputDir}' does not exist.`);
    console.log("Please create a 'lessons/' directory and place your PDFs inside.");
    process.exit(1);
  }

  // Ensure output directory exists, or create it
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all PDF files from the input directory and sort them numerically
  const files = fs.readdirSync(inputDir)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (files.length === 0) {
    console.log("No PDF files found in the 'lessons/' directory.");
    return;
  }

  console.log(`Found ${files.length} PDF file(s). Starting conversion...`);

  const systemInstruction = `You are an expert transcriber, technical editor, and LaTeX formatting specialist. Your task is to convert the PDF content into clean, well-structured Markdown that is highly compatible with LaTeX.

Key Instructions:
1. Structure & Corrections: Intelligently fix any context mistakes, OCR errors, or grammatical issues in the source text. Reorder and reformat the content to improve the logical flow and make it perfectly suited for Markdown and LaTeX.
2. Math Formatting (STRICT): Wrap all inline math and complexity theory symbols in single $, and wrap all block/display equations in $$.
   - CRITICAL: NEVER use Markdown formatting (like _, *, or **) inside math formulas! Underscores and asterisks inside $...$ must only be used for LaTeX subscripts and math operators, not for styling.
   - CRITICAL: NEVER mix Hebrew words inside a math formula. Math should contain only Latin/Greek letters and math symbols. If a formula needs a Hebrew word, close the formula, write the Hebrew word, and open a new formula.
   - Always ensure block equations ($$...$$) have a blank line before and after them.
3. Language Context: The text is primarily in Hebrew with English mathematical formulas.
4. RTL Formatting: Wrap the entire output in \`<div dir="rtl">\` and \`</div>\`. Do NOT add any directional HTML tags (like <span dir="ltr">) on individual formulas. The overall RTL div handles direction naturally.`;

  // Initialize the model with the enhanced system prompt
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemInstruction,
    generationConfig: {
      temperature: 0.2, // Low temperature for accuracy, but allows some freedom for fixing mistakes and reordering
    }
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(inputDir, file);
    const baseName = path.parse(file).name;
    const outputPath = path.join(outputDir, `${baseName}.md`);

    console.log(`\n[${i + 1}/${files.length}] Processing: ${file} ...`);

    if (SKIP_EXISTING_FILES && fs.existsSync(outputPath)) {
      console.log(` ⏩ Skipping ${file} (output/${baseName}.md already exists)`);
      continue;
    }

    try {
      // Read the PDF file directly into base64 format for the API Request
      const fileData = fs.readFileSync(filePath);
      const pdfPart = {
        inlineData: {
          data: fileData.toString("base64"),
          mimeType: "application/pdf"
        }
      };

      // Call the Gemini model
      const result = await model.generateContent([
        "Please transcribe, correct, and optimally format this PDF document according to your system instructions. Ensure perfect Markdown/LaTeX structure.",
        pdfPart
      ]);

      const text = result.response.text();

      // Save the generated Markdown to the output directory
      fs.writeFileSync(outputPath, text, 'utf-8');
      console.log(` \u2714 Successfully saved to output/${baseName}.md`);

    } catch (error) {
      console.error(` \u2716 Error processing ${file}:`, error.message || error);
    }

    // Add a delay between API calls to avoid rate limiting 
    // (Skips the delay after the very last file is processed)
    if (i < files.length - 1) {
      console.log(`Waiting 5 seconds before the next API call to respect rate limits...\n`);
      await delay(5000);
    }
  }

  console.log("\nConversion process complete!");
}

main();
