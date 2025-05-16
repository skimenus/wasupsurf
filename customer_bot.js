// customer_bot.js
require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const db = require('./db');

const bot = new Telegraf(process.env.CUSTOMER_BOT_TOKEN);

// /start — показать список доступных продуктов
bot.start(async ctx => {
  const { rows: products } = await db.query(
    'select id, name from products where available = true'
  );
  const buttons = products.map(p =>
    [Markup.button.callback(p.name, `SHOW_${p.id}`)]
  );
  return ctx.reply('Выберите товар или услугу:', Markup.inlineKeyboard(buttons));
});

// Обработка нажатия на товар — показать детали и кнопку «Заказать»
bot.action(/SHOW_(\d+)/, async ctx => {
  const id = ctx.match[1];
  const { rows } = await db.query(
    'select * from products where id = $1', [id]
  );
  const prod = rows[0];
  await ctx.replyWithPhoto(prod.image_url, {
    caption: `*${prod.name}*\n${prod.description}\nЦена: ${prod.price}₽`,
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('✅ Заказать', `ORDER_${prod.id}`)]
    ])
  });
  await ctx.answerCbQuery();
});

// Запрос количества после «Заказать»
bot.action(/ORDER_(\d+)/, ctx => {
  const prodId = ctx.match[1];
  ctx.session = { ordering: { product_id: prodId } };
  return ctx.reply('Укажите количество:');
});

// Захват количества и создание записи
bot.on('text', async ctx => {
  if (ctx.session && ctx.session.ordering) {
    const qty = parseInt(ctx.message.text);
    if (!qty || qty < 1) return ctx.reply('Введите корректное число.');
    const { product_id } = ctx.session.ordering;
    await db.query(
      'insert into orders(user_id, product_id, quantity) values($1,$2,$3)',
      [ctx.chat.id, product_id, qty]
    );
    delete ctx.session.ordering;
    return ctx.reply('Спасибо! Ваш заказ принят и ожидает обработки.');
  }
  return ctx.reply('Чтобы сделать заказ — отправьте /start.');
});

bot.launch();
