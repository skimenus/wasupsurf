// customer_bot.js

require('dotenv').config();
const { Telegraf, Markup, session } = require('telegraf');
const supabase = require('./lib/supabase');

const bot = new Telegraf(process.env.CUSTOMER_BOT_TOKEN);
bot.use(session());

// URL вашего Web App
const WEB_APP_URL = process.env.WEBAPP_URL || 'https://wasupsurf.onrender.com';

bot.start(async (ctx) => {
  // 1) Кнопка Web App
  await ctx.reply(
    'Добро пожаловать в WaSUP Surf! 👋\n' +
    'Нажмите кнопку ниже, чтобы открыть веб-приложение:',
    Markup.inlineKeyboard([
      [ Markup.button.webApp('🌊 Открыть приложение', WEB_APP_URL) ]
    ])
  );

  // 2) Список доступных товаров
  const { data: products, error } = await supabase
    .from('products')
    .select('id,name')
    .eq('available', true);

  if (error) {
    console.error('Ошибка при загрузке товаров:', error);
    return ctx.reply('Не удалось загрузить список товаров. Попробуйте позже.');
  }
  if (!products.length) {
    return ctx.reply(
      'Сейчас нет доступных товаров для заказа.\n' +
      'Вы можете открыть веб-приложение и оформить аренду SUP-доски там.'
    );
  }

  const buttons = products.map(p =>
    [ Markup.button.callback(p.name, `SHOW_${p.id}`) ]
  );
  await ctx.reply(
    'Или выберите товар из списка ниже, чтобы оформить заказ:',
    Markup.inlineKeyboard(buttons)
  );
});

bot.action(/SHOW_(\d+)/, async (ctx) => {
  const id = ctx.match[1];
  const { data: prod, error } = await supabase
    .from('products')
    .select('id,name,description,price,image_url')
    .eq('id', id)
    .single();

  if (error || !prod) {
    console.error('Error fetching product:', error);
    return ctx.reply('Товар не найден.');
  }

  await ctx.replyWithPhoto(
    { url: prod.image_url },
    {
      caption:
        `*${prod.name}*\n${prod.description}\n\n` +
        `Цена: ${prod.price}₽`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [ Markup.button.callback('✅ Заказать', `ORDER_${prod.id}`) ]
      ])
    }
  );
  await ctx.answerCbQuery();
});

bot.action(/ORDER_(\d+)/, (ctx) => {
  const prodId = ctx.match[1];
  ctx.session.ordering = { product_id: prodId };
  return ctx.reply('Укажите, пожалуйста, количество:');
});

bot.on('text', async (ctx) => {
  // Только если в сессии есть данные о заказе
  if (ctx.session && ctx.session.ordering) {
    const qty = parseInt(ctx.message.text, 10);
    if (!qty || qty < 1) {
      return ctx.reply('Введите корректное количество (число больше 0).');
    }

    const { product_id } = ctx.session.ordering;
    const { error } = await supabase
      .from('orders')
      .insert([{ user_id: ctx.chat.id, product_id, quantity: qty }]);

    delete ctx.session.ordering;

    if (error) {
      console.error('Error creating order:', error);
      return ctx.reply('Ошибка при оформлении заказа. Попробуйте позже.');
    }

    return ctx.reply('Спасибо! Ваш заказ принят и будет обработан.');
  }

  // Если текст пришёл не в процессе заказа
  return ctx.reply('Чтобы оформить заказ, отправьте /start и выберите товар.');
});

bot.launch()
  .then(() => console.log('Customer bot started'))
  .catch(console.error);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
