const axios = require('axios');
const cheerio = require('cheerio');

async function testIpoCentral() {
    const urls = ['https://ipocentral.in/ipo-gmp-grey-market-premium/', 'https://ipocentral.in/'];
    
    for (const url of urls) {
        console.log(`\n--- Testing ${url} ---`);
        try {
            const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
            const $ = cheerio.load(response.data);
            const table = $('table').first();
            if (table.length > 0) {
                console.log("IPOCentral Table found!");
                let out = '<table class="' + (table.attr('class') || '') + '">\n';
                table.find('tr').slice(0, 3).each((i, row) => {
                    out += '  <tr>\n';
                    $(row).find('th, td').each((j, cell) => {
                        const tag = cell.tagName;
                        const text = $(cell).text().trim().replace(/\s+/g, ' ');
                        out += `    <${tag}>${text}</${tag}>\n`;
                    });
                    out += '  </tr>\n';
                });
                out += '</table>';
                console.log(out);
                return;
            } else {
                console.log("No table found.");
            }
        } catch (e) { console.log("Fetch failed:", e.message); }
    }
}
testIpoCentral();
