const express = require('express');
const path = require('node:path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve root directory static files (index.html, etc.)
app.use(express.static(__dirname));

// Fallback to index.html for any route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=================================================`);
  console.log(`🚀 FitPulse PWA Server is running!`);
  console.log(`📱 Local (PC):       http://localhost:${PORT}`);
  console.log(`📱 Network (iPhone): http://0.0.0.0:${PORT}`);
  console.log(`=================================================\n`);
});
