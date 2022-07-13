const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
require('dotenv').config;
const connect = require('./schemas');
const kakaoRouter = require('./routes/usersRouter');
const passport = require('passport');
const passportConfig = require('./passport');
const session = require('express-session');
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));

connect();
passportConfig();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/api/comments', require('./routes/commentsRouter.js'));
app.use('/api/posts', require('./routes/postsRouter.js'));
app.use('/api', require('./routes/usersRouter'));
app.use('/api', require('./routes/mypageRouter.js'));
app.use('/api/kakao', kakaoRouter);
app.use(
  session({
    secret: 'mpti',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl, ' - ', new Date());
  next();
});


app.get('/', (req, res) => {
  res.send('hello world');
});

app.listen(process.env.PORT, () => {
  console.log(`listening on 3000`);
});
