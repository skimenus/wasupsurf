// admin_bot.js
require('dotenv').config();
const { Telegraf } = require('telegraf');
const db = require('./db');

const bot = new Telegraf(process.env.ADMIN_BOT_TOKEN);

bot.start(ctx => ctx.reply('Привет, админ! Используйте /orders для списка заказов.'));

bot.command('orders', async ctx => {
  const { rows } = await db.query(`
    select o.id, u.user_id, p.name, o.quantity, o.status, o.created_at
    from orders o
    join products p on o.product_id = p.id
    order by o.created_at desc
    limit 20
  `);
  if (!rows.length) return ctx.reply('Нет заказов.');
  const msgs = rows.map(o =>
    `#${o.id} ${o.name} x${o.quantity}\nСтатус: ${o.status}\nДата: ${o.created_at.toISOString()}\n`
  );
  ctx.reply(msgs.join('\n—\n'));
});

// Команда для обновления статуса: /set 5 processing
bot.command('set', async ctx => {
  const args = ctx.message.text.split(' ');
  if (args.length !== 3) return ctx.reply('Используйте: /set <id> <status>');
  const [ , id, status ] = args;
  await db.query('update orders set status=$2 where id=$1', [id, status]);
  ctx.reply(`Заказ #${id} переведён в статус "${status}".`);
});

bot.launch();
