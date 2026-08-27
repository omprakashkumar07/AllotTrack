const fs = require('fs');

const html = fs.readFileSync('../scratch_investorgain.html', 'utf8');

// The Next.js flight data often splits large JSON strings across multiple chunks. 
// However, all chunks are pushed to self.__next_f. 
// We can reconstruct the full string by concatenating all chunks.
const chunks = [];
const regex = /self\.__next_f\.push\(\[\d+,"(.*?)"\]\)/g;
let match;
while ((match = regex.exec(html)) !== null) {
    // Unescape the string chunk
    try {
        const unescaped = JSON.parse('"' + match[1] + '"');
        chunks.push(unescaped);
    } catch (e) {
        // Ignore parse errors for individual chunks, but this is the right way to unescape Next.js chunks
    }
}

const fullText = chunks.join('');
const resultDataMatch = fullText.match(/"resultData":(\{.*?"reportData":\[.*?\]\})/);

if (resultDataMatch) {
    let jsonStr = resultDataMatch[1];
    // It might have trailing garbage, so we can extract just the reportData array
    const reportDataMatch = fullText.match(/"reportData":(\[.*?\]),"report_table_html"/);
    if (reportDataMatch) {
        try {
            const reportData = JSON.parse(reportDataMatch[1]);
            fs.writeFileSync('scratch_ipo_data.json', JSON.stringify(reportData, null, 2));
            console.log("Successfully extracted reportData with", reportData.length, "IPOs");
            console.log("First IPO:", reportData[0]);
        } catch(e) {
            console.log("Error parsing reportData:", e.message);
        }
    } else {
        console.log("Could not find reportData array");
    }
} else {
    console.log("Could not find resultData in reconstructed text");
}
