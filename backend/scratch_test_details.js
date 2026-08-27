const axios = require('axios');
const cheerio = require('cheerio');

async function checkDetails() {
    try {
        const detailResponse = await axios.get('https://ipocentral.in/deepa-jewellers-ipo-gmp-price-allotment/', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        const $d = cheerio.load(detailResponse.data);
        
        // Find Lot Size
        let out = "";
        $d('table').each((i, tab) => {
            const text = $d(tab).text().replace(/\s+/g, ' ');
            if (text.includes('Allotment') || text.includes('Listing') || text.includes('Lot') || text.includes('Shares')) {
                out += `\n--- Detail Table ${i} snippet ---\n`;
                $d(tab).find('tr').each((j, row) => {
                    let rowData = [];
                    $d(row).find('td, th').each((k, cell) => {
                        rowData.push($d(cell).text().trim().replace(/\s+/g, ' '));
                    });
                    out += `Row ${j}: ${rowData.join(' | ')}\n`;
                });
            }
        });
        console.log(out || "No tables with Allotment/Listing/Lot found on detail page.");
    } catch (e) {
        console.log("Error:", e.message);
    }
}
checkDetails();
