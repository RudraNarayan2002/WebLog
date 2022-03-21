if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }

const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./Utils/ExpressError');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoSanitize = require('express-mongo-sanitize')
const User = require('./models/user');
// const {isLoggedIn, isAuthor} = require('./middleware')
const blogs = require('./routes/blogs');
const comments = require('./routes/comments');

const MongoDBStore = require("connect-mongo") (session);
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/blog-app";

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const app = express();

const userRoutes = require('./routes/users');

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    mongoSanitize({
      replaceWith: "_",
    })
  );

  const secret = process.env.SECRET || "thisshouldbeasecret!";

  const store = new MongoDBStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
  });
  

  store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
  });

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
       
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {

    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// app.get('/fakeUser', async(req, res) => {
//     const user = new User({ email: 'rudraa@gmail.com', username: 'rudraa'})
//     const newUser = await User.register(user, 'chicken');
//     res.send(newUser);
// })




const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});
  
app.use('/', userRoutes);
app.use('/blogs', blogs)
app.use('/blogs/:id/comments', comments)

app.get('/', (req,res) => {
    res.render('home');
})
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 4000;

app.listen(port, () => {
console.log(`Serving on port ${port}`);
})