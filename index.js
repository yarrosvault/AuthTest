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
        <h2>✅ Discord Connected!</h2>
        <p>Your ID: ${discordUser.id}</p>
        <p>You can now return to Roblox.</p>
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
