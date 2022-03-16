const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const catchAsync = require('./Utils/catchAsync');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./Utils/ExpressError');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const Blog = require('./models/blog');
const Comment = require('./models/comment');
const User = require('./models/user');
const {isLoggedIn} = require('./middleware')
const app = express();

const userRoutes = require('./routes/users');

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
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
    console.log(req.session)
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

app.use('/', userRoutes);

mongoose.connect('mongodb://localhost:27017/blog-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});
  
app.get('/', (req,res) => {
    res.render('home');
})

app.get('/blogs', catchAsync(async(req,res) => {
    const blogs = await Blog.find({});
    res.render('blogs/index', {blogs});
}))

app.get('/blogs/new', isLoggedIn, (req,res) => {
    res.render('blogs/new');
})

app.post('/blogs', isLoggedIn, catchAsync(async(req, res, next) => {
    if(!req.body.blog) throw new ExpressError('Invalid Blog Data', 400);
    const blog = new Blog(req.body.blog);
    await blog.save();
    req.flash('success', 'Successfully made a new blog!');
    res.redirect(`/blogs/${blog._id}`)
}))

app.get('/blogs/:id', catchAsync(async(req,res) => {
    const blog = await Blog.findById(req.params.id).populate('comments');
    if(!blog) {
        req.flash('error', 'Cannot find that blog!');
        return res.redirect('/blogs');
    }
    res.render('blogs/show', {blog});
}))

app.get('/blogs/:id/edit', isLoggedIn, catchAsync(async(req,res) => {
    const blog = await Blog.findById(req.params.id);
    if(!blog) {
        req.flash('error', 'Cannot find that blog!');
        return res.redirect('/blogs');
    }
    res.render('blogs/edit', {blog}); 
}))

app.put('/blogs/:id',isLoggedIn, catchAsync(async(req,res) => {
    const {id} = req.params;
    const blog = await Blog.findByIdAndUpdate(id,{...req.body.blog})
    req.flash('success', 'Successfully updated blog!')
    res.redirect(`/blogs/${blog._id}`)
}))

app.delete('/blogs/:id', isLoggedIn, catchAsync(async (req,res) => {
    const {id} = req.params;
    await Blog.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted blog!');
    res.redirect('/blogs'); 
}))

app.post('/blogs/:id/comments', catchAsync(async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    const comment = new Comment(req.body.comment);
    blog.comments.push(comment);
    await comment.save();
    await blog.save();
    req.flash('success', 'Created new comment!');
    res.redirect(`/blogs/${blog._id}`);
}))

// app.get('/makeblog', async (req, res) => {
//     const bblog = new Blog({ title: 'The Growing Creatives', description:'changed society in a great extent'});
//     await bblog.save();
//     res.send(bblog)
// })

app.delete('/blogs/:id/comments/:commentId', catchAsync(async (req, res) =>{
    const {id, commentId} = req.params;
    await Blog.findByIdAndUpdate(id, { $pull: { comments: commentId}});
    await Comment.findByIdAndDelete(commentId);
    req.flash('success', 'Successfully deleted comment!');
    res.redirect(`/blogs/${id}`);
}))

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(4000, () => {
console.log('Serving on port 4000');
})