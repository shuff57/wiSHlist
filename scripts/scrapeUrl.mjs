import fs from 'fs';
import path from 'path';
import got from 'got';
import { HttpsProxyAgent } from 'hpagent';
import metascraper from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperUrl from 'metascraper-url';

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

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('Usage: node scripts/scrapeUrl.mjs <url>');
  process.exit(1);
}

const proxyHost = process.env.BRIGHTDATA_ENDPOINT;
const proxyPort = Number(process.env.BRIGHTDATA_PORT);
const proxyUsername = process.env.BRIGHTDATA_USERNAME;
const proxyPassword = process.env.BRIGHTDATA_PASSWORD;

if (!proxyHost || !proxyPort || !proxyUsername || !proxyPassword) {
  console.error('Bright Data environment variables are not properly set.');
  process.exit(1);
}

const proxyUrl = `http://${proxyUsername}:${proxyPassword}@${proxyHost}:${proxyPort}`;
const agent = {
  https: new HttpsProxyAgent({ keepAlive: true, proxy: proxyUrl })
};

const scraper = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperUrl()
]);

function extractAmazonPrice(html) {
  const patterns = [
    /<span class="a-price-whole">([^<]+)<\/span>/,
    /<span class="a-offscreen">\$?([0-9,]+\.?[0-9]*)<\/span>/,
    /<span[^>]*class="[^\"]*a-price[^\"]*"[^>]*>\s*\$?([0-9,]+\.?[0-9]*)/,
    /<span[^>]*class="[^\"]*a-price-range[^\"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)/,
    /"priceAmount":([0-9,]+\.?[0-9]*)/,
    /\$([0-9,]+\.[0-9]{2})/,
    /USD\s+([0-9,]+\.?[0-9]*)/,
    /<span[^>]*class="[^\"]*a-text-strike[^\"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)/
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/[^0-9.]/g, '');
      if (cleaned && !Number.isNaN(Number.parseFloat(cleaned))) {
        return `$${Number.parseFloat(cleaned).toFixed(2)}`;
      }
    }
  }
  return null;
}

try {
  const { body: html, url } = await got(targetUrl, {
    agent,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    },
    timeout: { request: 20000 },
    retry: { limit: 1 },
    https: { rejectUnauthorized: false }
  });

  const metadata = await scraper({ html, url });
  const price = extractAmazonPrice(html);

  if (price) {
    metadata.price = price;
  }

  console.log(JSON.stringify({ metadata }, null, 2));
} catch (error) {
  console.error('Scrape failed:', error.message);
  if (error.response) {
    console.error('Status code:', error.response.statusCode);
  }
  process.exit(1);
}
