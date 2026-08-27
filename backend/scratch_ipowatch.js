const fs = require('fs');
const cheerio = require('cheerio');

try {
    const html = fs.readFileSync('scratch_ipowatch.html', 'utf8');
    const $ = cheerio.load(html);

    // Find table that likely contains IPO data
    const table = $('table').first();
    
    if (table.length > 0) {
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
        console.log("FOUND TABLE HTML:");
        console.log(out);
    } else {
        console.log("No table found on IPOWatch");
    }
} catch (e) {
    console.error("Error reading file:", e.message);
}
