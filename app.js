const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
require('dotenv').config;
const connect = require('./schemas');
const passport = require('passport');
const passportConfig = require('./passport');
const session = require('express-session');
// const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
app.use(cors({ 
  origin: true, 
  credentials: true,
  // header: {
  //   'Access-Control-Allow-origin' :  'http://localhost:3000'
  // } 
}));
app.use(helmet({ contentSecurityPolicy: false }));


connect();
passportConfig();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/api/comments', require('./routes/commentsRouter.js'));
app.use('/api/posts', require('./routes/postsRouter.js'));
app.use('/api', require('./routes/usersRouter'));
app.use('/api', require('./routes/mypageRouter.js'));
app.use('/api', require('./routes/chatsRouter'));
app.use('/api', require('./routes/blocksRouter'));
app.use('/api/kakao', require('./routes/kakaosRouter'));
app.use('/api', createProxyMiddleware({ target: 'https://localhost:3000', changeOrigin: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'SECRET',
  // store: MongoStore.create({ mongoUrl: process.env.DB_URL }), // session 저장 장소 (Mongoose를 이용하여 Mongodb로 설정)
  cookie: {
    httpOnly: true,
    secure: false,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl, ' - ', new Date());
  next();
});

// app.get('/api', (req,res) => {
//   res.header('Access-Control-Allow-Origin', 'https://localhost:3000');
//   res.send(data);
// });


app.get('/', (req, res) => {
  res.send('hello world');
});

app.listen(process.env.PORT, () => {
  console.log(`listening on 3000`);
});
