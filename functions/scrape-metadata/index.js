import got from 'got';
import metascraper from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperUrl from 'metascraper-url';
import metascraperAuthor from 'metascraper-author';
import metascraperDate from 'metascraper-date';
import metascraperLogo from 'metascraper-logo';
import metascraperPublisher from 'metascraper-publisher';

export default async function main(req, res) {
  const { url } = req.body || {};
  if (!url) {
    res.json({ error: 'Missing url parameter' }, 400);
    return;
  }
  try {
    const { body: html } = await got(url);
    const metadata = await metascraper([
      metascraperTitle(),
      metascraperDescription(),
      metascraperImage(),
      metascraperUrl(),
      metascraperAuthor(),
      metascraperDate(),
      metascraperLogo(),
      metascraperPublisher()
    ])({ html, url });
    res.json(metadata);
  } catch (err) {
    res.json({ error: err.message }, 500);
  }
}
