const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const authRoute = require('./routes').auth;
const courseRoute = require('./routes').course;
const passport = require('passport');
require('./config/passport')(passport);
const cors = require('cors');
mongoose
  .connect(process.env.MONGODB_CONNECTION)
  .then(() => {
    console.log('connecting to mongodb...');
  })
  .catch((e) => {
    console.log(e);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/api/user', authRoute);
app.use(
  '/api/courses',
  passport.authenticate('jwt', { session: false }),
  courseRoute
);

app.listen(8080, () => {
  console.log('後端伺服器聆聽8080...');
});
