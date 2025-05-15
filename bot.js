// bot.js

require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(async (ctx) => {
  await ctx.reply(
    'Добро пожаловать в WaSUP Surf!\nНажмите кнопку ниже, чтобы открыть приложение:',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🌊 Открыть приложение',
              web_app: { url: 'https://wasupsurf.onrender.com' }
            }
          ]
        ]
      }
    }
  );
});

bot.on('message', (ctx) =>
  ctx.reply('Чтобы открыть наш сервис, отправьте /start и нажмите на кнопку «Открыть приложение»')
);

bot
  .launch()
  .then(() => console.log('Bot started'))
  .catch(console.error);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
