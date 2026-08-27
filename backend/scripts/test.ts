import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
  try {
    const res = await axios.get('https://ipocentral.in/symbiotec-pharmalab-ipo-gmp-price-allotment/');
    const $ = cheerio.load(res.data);
    $('table').each((i, t) => {
      console.log('--- Table ' + i + ' ---');
      console.log($(t).html());
    });
  } catch (err) {
    console.error(err);
  }
}
main();
