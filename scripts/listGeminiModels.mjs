import fs from 'fs';
import path from 'path';

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

const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
url.searchParams.set('key', apiKey);

const response = await fetch(url.toString());

if (!response.ok) {
  console.error(`Failed to list models: ${response.status} ${response.statusText}`);
  const body = await response.text();
  console.error(body);
  process.exit(1);
}

const payload = await response.json();
const models = payload?.models ?? [];

if (models.length === 0) {
  console.log('No models returned for the configured API key.');
  process.exit(0);
}

const formatted = models.map((model) => {
  const parts = [model.name];
  if (model.displayName && model.displayName !== model.name) {
    parts.push(`(${model.displayName})`);
  }
  if (model.inputTokenLimit && model.outputTokenLimit) {
    parts.push(`tokens: in ${model.inputTokenLimit.toLocaleString()} / out ${model.outputTokenLimit.toLocaleString()}`);
  }
  if (Array.isArray(model.supportedGenerationMethods) && model.supportedGenerationMethods.length > 0) {
    parts.push(`methods: ${model.supportedGenerationMethods.join(', ')}`);
  }
  return parts.join(' | ');
});

console.log('Available Gemini models for this API key:\n');
formatted.forEach((line) => console.log(`- ${line}`));
