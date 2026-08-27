const axios = require('axios');
const fs = require('fs');

async function fetchIpowatch() {
    try {
        const response = await axios.get('https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        });
        fs.writeFileSync('scratch_ipowatch.html', response.data);
        console.log("Successfully fetched ipowatch");
    } catch (error) {
        console.error("Error fetching ipowatch:", error.message);
    }
}

fetchIpowatch();
