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

  // Initialize the model with the strongly-worded system prompt
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: "You are an expert transcriber. You must convert the PDF content into clean Markdown, wrap all inline math and complexity theory symbols in $, and wrap all block equations in $$. You must not summarize or hallucinate text; transcribe everything exactly as written. The text is primarily in Hebrew with English mathematical formulas. Ensure the generated Markdown output is formatted correctly for Right-to-Left (RTL) reading by wrapping the entire output in HTML `<div dir=\"rtl\">...</div>`. CRITICAL INSTRUCTION For Math and English inside RTL: When writing inline math formulas like $S_f$ or $O(n)$, or any English variables/text inside the Hebrew sentences, you MUST wrap the equation or English word itself with a `<span dir=\"ltr\">` tag to ensure it renders left-to-right correctly and the subscript/superscript letters do not jump sides. For example, write `<span dir=\"ltr\">$S_f$</span>` instead of just `$S_f$`. Do this for ALL inline equations and standalone English variables."
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(inputDir, file);
    const baseName = path.parse(file).name;
    const outputPath = path.join(outputDir, `${baseName}.md`);

    console.log(`[${i + 1}/${files.length}] Processing: ${file} ...`);

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
        "Please transcribe this PDF document perfectly according to your system instructions.", 
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
