const fs = require('fs');

const html = fs.readFileSync('scratch_chittorgarh.html', 'utf8');

const regex = /self\.__next_f\.push\(\[\d+,"(.*?)"]\)/s;
const matches = [...html.matchAll(/self\.__next_f\.push\(\[\d+,"(.*?)"\]\)/g)];

let foundJSON = false;
for (const match of matches) {
    if (match[1].includes('resultData')) {
        console.log("Found resultData in Chittorgarh Next.js payload!");
        console.log(match[1].substring(0, 1000));
        foundJSON = true;
        break;
    }
}

if (!foundJSON) {
    console.log("No resultData found. Is it Next.js?");
    console.log("Contains __NEXT_DATA__:", html.includes('__NEXT_DATA__'));
    console.log("Contains __next_f:", html.includes('__next_f'));
    
    // Check if there are any tables at all
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    console.log("Number of tables:", $('table').length);
}
