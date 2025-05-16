// customer_bot.js
require('dotenv').config();
const { Telegraf, Markup, session } = require('telegraf');
const supabase = require('./lib/supabase');

const bot = new Telegraf(process.env.CUSTOMER_BOT_TOKEN);
bot.use(session());

const WEB_APP_URL = process.env.WEBAPP_URL || 'https://wasupsurf.onrender.com';

bot.start(async (ctx) => {
  // 1) Сразу reply-keyboard внизу «Open Wallet»
  await ctx.reply(
    '🔹 Для быстрого доступа нажмите кнопку',
    Markup.keyboard([
      [ Markup.button.webApp('🌊 Открыть приложение', WEB_APP_URL) ]
    ], {
      resize_keyboard: true,
      one_time_keyboard: false
    })
  );

  // 2) Inline-keyboard для выбора товара
  const { data: products, error } = await supabase
    .from('products')
    .select('id,name')
    .eq('available', true);

  if (error) {
    console.error('Error fetching products:', error);
    return ctx.reply('Не удалось загрузить список товаров.');
  }

  if (!products.length) {
    return ctx.reply('Сейчас нет доступных товаров. Используйте кнопку ниже для открытия приложения.');
  }

  const inlineButtons = products.map(p =>
    [ Markup.button.callback(p.name, `SHOW_${p.id}`) ]
  );

  await ctx.reply(
    'Или выберите товар из списка ниже, чтобы оформить заказ:',
    Markup.inlineKeyboard(inlineButtons)
  );
});

// ... остальной код без изменений ...
