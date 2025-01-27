var createError = require('http-errors');
var express = require('express');
var path = require('path');
const multer = require('multer');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

var app = express();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req,res,next) => {
  const projekatCookie = req.cookies?.HNUser

  if(req.path === '/users/login' || req.path === '/users/login_user') {
    return next();
  }
  if(projekatCookie) {
    const userData = projekatCookie;
    const email = userData.email;
    const password = userData.password;

    res.userData = userData;
    return next();
  }
  else{
    return next();//nema cookies
  }
})

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/uploads', express.static('uploads'));



app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
