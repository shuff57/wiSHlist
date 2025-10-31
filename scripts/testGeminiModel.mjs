import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

function loadEnvFromFile(filename) {
  const envPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, 'utf8');
  contents.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith('#')) {
      return;
    }
    const idx = line.indexOf('=');
    if (idx === -1) {
      return;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFromFile('.env.local');
loadEnvFromFile('.env');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY in environment.');
  process.exit(1);
}

const modelId = process.env.GEMINI_MODEL || 'gemini-flash-latest';

console.log(`Testing Gemini model: ${modelId}`);

try {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelId });
  const result = await model.generateContent('Reply with the single word "success" if you can read this.');
  const response = await result.response;
  const text = response.text().trim();
  console.log('Model replied with:', text);
  if (text.toLowerCase().includes('success')) {
    console.log('Gemini model test passed.');
  } else {
    console.warn('Gemini model responded without the expected keyword. Inspect output above.');
  }
} catch (error) {
  console.error('Gemini model test failed:', error);
  process.exit(1);
}
