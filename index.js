const express = require('express');
const { BotFrameworkAdapter } = require('botbuilder');
const { CotacaoBot } = require('./bot/cotacaoBot');

const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppID,
    appPassword: process.env.MicrosoftAppPassword
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${ error }`);
    await context.sendActivity('The bot encountered an error or bug.');
};

// Creating a server
let app = express();
let port = 3000;

const bot = new CotacaoBot(); 

app.post('/buscar', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        await bot.run(context);
    });
});

app.listen(port, () => {
  console.log(`Server online in http://localhost:${port}`)
});