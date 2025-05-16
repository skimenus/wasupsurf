// admin_bot.js

require('dotenv').config();
const { Telegraf } = require('telegraf');
const supabase = require('./lib/supabase');

const bot = new Telegraf(process.env.ADMIN_BOT_TOKEN);

bot.start(ctx =>
  ctx.reply('Привет, админ! Используйте /orders для просмотра списка заказов.')
);

bot.command('orders', async ctx => {
  // Получаем последние 20 заказов с именем продукта из таблицы products
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`id, quantity, status, created_at, product:products(name)`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching orders:', error);
    return ctx.reply('Ошибка при загрузке заказов.');
  }
  if (!orders.length) {
    return ctx.reply('Нет заказов.');
  }

  const msgs = orders.map(o =>
    `#${o.id} ${o.product.name} x${o.quantity}\n` +
    `Статус: ${o.status}\n` +
    `Дата: ${new Date(o.created_at).toLocaleString()}\n`
  );
  ctx.reply(msgs.join('\n—\n'));
});

bot.command('set', async ctx => {
  const args = ctx.message.text.trim().split(/\s+/);
  if (args.length !== 3) {
    return ctx.reply('Используйте: /set <id> <status>');
  }
  const [ , id, status ] = args;
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', Number(id));

  if (error) {
    console.error('Error updating order status:', error);
    return ctx.reply('Не удалось обновить статус заказа.');
  }
  ctx.reply(`Заказ #${id} переведён в статус «${status}».`);
});

bot.launch()
  .then(() => console.log('Admin bot started'))
  .catch(console.error);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = {}; // экспорт не нужен, всё обрабатывается внутри этого файла
