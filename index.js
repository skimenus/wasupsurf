const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);

app.set('view engine', 'ejs');
app.set('layout', 'layout');

// Routes
app.get('/',       (req, res) => res.render('index'));
app.get('/about',  (req, res) => res.render('about'));
app.get('/locations',(req, res) => res.render('locations'));
app.get('/rental', (req, res) => res.render('rental'));
app.get('/bookings',(req, res) => res.render('bookings'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`WaSUP Surf server running on port ${PORT}`)
);
