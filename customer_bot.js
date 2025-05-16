// customer_bot.js

require('dotenv').config();
const { Telegraf, Markup, session } = require('telegraf');
const supabase = require('./lib/supabase');

const bot = new Telegraf(process.env.CUSTOMER_BOT_TOKEN);

// Включаем хранение сессий в памяти
bot.use(session());

// /start — показать список доступных продуктов
bot.start(async ctx => {
  const { data: products, error } = await supabase
    .from('products')
    .select('id,name')
    .eq('available', true);

  if (error) {
    console.error('Error fetching products:', error);
    return ctx.reply('Ошибка загрузки товаров.');
  }

  const buttons = products.map(p =>
    [Markup.button.callback(p.name, `SHOW_${p.id}`)]
  );
  return ctx.reply('Выберите товар или услугу:', Markup.inlineKeyboard(buttons));
});

// Обработка нажатия на товар — показать детали и кнопку «Заказать»
bot.action(/SHOW_(\d+)/, async ctx => {
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
        `*${prod.name}*\n` +
        `${prod.description}\n` +
        `Цена: ${prod.price}₽`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Заказать', `ORDER_${prod.id}`)]
      ])
    }
  );
  await ctx.answerCbQuery();
});

// Запрос количества после «Заказать»
bot.action(/ORDER_(\d+)/, ctx => {
  const prodId = ctx.match[1];
  ctx.session.ordering = { product_id: prodId };
  return ctx.reply('Укажите количество:');
});

// Захват количества и создание записи
bot.on('text', async ctx => {
  if (ctx.session.ordering) {
    const qty = parseInt(ctx.message.text);
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
      return ctx.reply('Ошибка при создании заказа.');
    }

    return ctx.reply('Спасибо! Ваш заказ принят и ожидает обработки.');
  }

  return ctx.reply('Чтобы сделать заказ — отправьте /start.');
});

// Запускаем бота
bot.launch()
  .then(() => console.log('Customer bot started'))
  .catch(console.error);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
