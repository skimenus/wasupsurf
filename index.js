// index.js

require('dotenv').config();                    // Загружаем .env
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const supabase = require('./lib/supabase');    // HTTP-SDK Supabase
const { notifyAdmin } = require('./admin_bot'); // Функция уведомлений

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layout');

// GET-роуты (рендер EJS-шаблонов)
app.get('/',        (req, res) => res.render('index'));
app.get('/about',   (req, res) => res.render('about'));
app.get('/locations',(req, res) => res.render('locations'));
app.get('/rental',  (req, res) => res.render('rental'));

// GET /bookings — список бронирований
app.get('/bookings', async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.render('bookings', { bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).send('Не удалось загрузить бронирования');
  }
});

// POST /bookings — создание новой брони
app.post('/bookings', async (req, res) => {
  const { name, date, location, contact } = req.body;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ name, date, location, contact }])
      .select()
      .single();

    if (error) throw error;
    const booking = data;

    // Уведомление администратору
    if (process.env.ADMIN_CHAT_ID) {
      await notifyAdmin(
        `📌 Новая бронь:\n` +
        `Имя: ${booking.name}\n` +
        `Дата: ${booking.date}\n` +
        `Локация: ${booking.location}\n` +
        `Контакт: ${booking.contact}`
      );
    }

    res.render('booking-success', { booking });
  } catch (err) {
    console.error('Error saving booking:', err);
    res.status(500).send('Ошибка при сохранении бронирования');
  }
});

// Обработка 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`WaSUP Surf server running on port ${PORT}`)
);
