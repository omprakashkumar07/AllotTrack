const fs = require('fs');
const html = fs.readFileSync('../scratch_investorgain.html', 'utf8');

// Look for API endpoints in Next.js build or general html
const fetchMatches = html.match(/fetch\s*\(\s*["']([^"']+)["']/g);
console.log("Fetch calls:", fetchMatches);

// Check if we can find any URLs starting with /api/
const apiMatches = html.match(/["']\/api\/[^"']+["']/g);
console.log("API URLs:", apiMatches ? [...new Set(apiMatches)] : null);

// Check for Chittorgarh as well
try {
    const chitHtml = fs.readFileSync('scratch_chittorgarh.html', 'utf8');
    const chitApi = chitHtml.match(/["']\/api\/[^"']+["']/g);
    console.log("Chittorgarh API URLs:", chitApi ? [...new Set(chitApi)] : null);
} catch (e) {}

