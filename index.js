const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const CLIENT_ID = "1274952030116515954"; // Your actual Discord app client ID
const CLIENT_SECRET = "xC3TTOcpNH5vsGOWV8WVWxgG7SFR89Ts";
const REDIRECT_URI = "https://syde-e151.onrender.com/callback";


let userMap = {};

app.get("/login", (req, res) => {
    const state = Math.random().toString(36).substring(2); // optional state token
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify&state=${state}`;
    res.redirect(url);
});

app.get("/callback", async (req, res) => {
    const code = req.query.code;

    const tokenResponse = await axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
    }), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        }
    });

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
        headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`,
        }
    });

    const discordUser = userResponse.data;
    userMap[discordUser.id] = {
        username: `${discordUser.username}#${discordUser.discriminator}`,
        time: Date.now()
    };

    // Tell the user to return to Roblox
    res.send(`
     <html>
    <head>
      <title>Discord Connected</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body {
          background-color: #0f0f0f;
          font-family: 'Poppins', sans-serif;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }

        .container {
          background: #1e1e1e;
          border-radius: 16px;
          padding: 40px 50px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.6);
          text-align: center;
          max-width: 400px;
        }

        h1 {
          color: #00ff88;
          margin-bottom: 10px;
          font-weight: 600;
        }

        .username {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .id {
          font-size: 14px;
          color: #aaa;
          margin-bottom: 20px;
        }

        .note {
          font-size: 13px;
          color: #ccc;
        }

        .fade {
          animation: fadeIn 0.6s ease-in-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
    </head>
    <body>
      <div class="container fade">
        <h1>✅ Discord Connected</h1>
        <div class="username">${user.username}#${user.discriminator}</div>
        <div class="id">ID: ${user.id}</div>
        <div class="note">You can now return to Roblox.</div>
      </div>
    </body>
  </html>
    `);
});

app.get("/getuser/:discordId", (req, res) => {
    const user = userMap[req.params.discordId];
    if (user && Date.now() - user.time < 300000) { // 5 minute cache
        res.json({ username: user.username });
    } else {
        res.json({ username: null });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
