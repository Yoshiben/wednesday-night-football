const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://yoshiben.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { password, players, matches } = req.body;
  const HASHED_PASSWORD = '48690';
  const PAT = process.env.DISPATCH_TOKEN;

  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const passwordHash = hash.toString();

  if (passwordHash !== HASHED_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  try {
    const response = await fetch(
      'https://api.github.com/repos/Yoshiben/wednesday-night-football/actions/workflows/update-data.yml/dispatches',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${PAT}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            players: JSON.stringify(players),
            matches: JSON.stringify(matches)
          }
        })
      }
    );

    if (response.ok) {
      res.status(200).json({ message: 'Workflow triggered successfully' });
    } else {
      const errorData = await response.json();
      res.status(response.status).json({ error: errorData.message });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
