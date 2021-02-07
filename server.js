// modules
const express = require("express");
const app = express();
const config = require("./config");
const client = new (require("discord.js")).Client();
const Badges = require("./Badges");
const PORT = config.PORT || 3000;

const moment = require('moment')
moment.locale('fr')

client.on("ready", () => {
    client.user.setStatus("invisible");
});

// run the client
client.login(config.TOKEN);

// config
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// main route
app.get("/", (req, res) => {
    res.render("index", {
        error: null
    });
});

// redirect post requests to get
app.post("/", async (req, res) => {
    if(req.body.user) res.redirect(`/${req.body.user}`);
    else res.redirect("/404");
});

// main route (get)
app.get("/:userID/:json?", async (req, res) => {
    if (req.params.json = 'json') {
        var user = client.users.cache.get(req.params.id)
        if (!user) {
            user = await client.users.fetch(req.params.id).catch(e => {
                res.send('{"error":"undefined"}')
            })
        } else res.send(user);
    } else {
        const userid = req.params.userID;
        if (!userid) return res.redirect("/404", {
            title: config.title
        });

        // fetch user
        const user = userid === client.user.id ? client.user : await client.users.fetch(getID(userid)).catch(e => {
        });
        if (!user) return res.render("index", {
            error: "Invalid user id!",
            title: config.title
        });
        if (!user.flags) await user.fetchFlags();
        // get data
        const Flags = user.flags.toArray();
        if (user.bot && Flags.includes("VERIFIED_BOT")) user.verified = true;
        const flags = Flags.filter(b => !!Badges[b]).map(m => Badges[m]);
        if (user.avatar && user.avatar.startsWith("a_")) flags.push(Badges["DISCORD_NITRO"]);
        if (user.bot) {
            flags.push(Badges["BOT"]);
        }

        return res.render("user", {
            user,
            flags,
            title: config.title
        });
    }

});
// handle invalid routes/methods
app.all("*", (req, res) => {
    return res.render("404");
});

// start the server
app.listen(PORT, () => {
    console.log(`Website running on port :${PORT}`);
});

// resolve user id
function getID(source) {
    const tokenRegex = /([MN][A-Za-z\d]{23})\.([\w-]{6})\.([\w-]{27})/;
    const isToken = tokenRegex.test(source);
    if (isToken) {
        const base64 = source.split(".")[0];
        const id = Buffer.from(base64, 'base64').toString();
        return id;
    }
    return source;
}
