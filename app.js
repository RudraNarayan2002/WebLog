const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const catchAsync = require('./Utils/catchAsync');
const ExpressError = require('./Utils/ExpressError');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Blog = require('./models/blog');
const Comment = require('./models/comment');
const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/blogs/new', (req,res) => {
    res.render('blogs/new');
})

app.post('/blogs', catchAsync(async(req, res, next) => {
    if(req.body.blog) throw new ExpressError('Invalid Blog Data', 400);
    const blog = new Blog(req.body.blog);
    await blog.save();
    res.redirect(`/blogs/${blog._id}`)
}))

app.get('/blogs/:id', catchAsync(async(req,res) => {
    const blog = await Blog.findById(req.params.id).populate('comments');
    // console.log(blog);
    res.render('blogs/show', {blog});
}))

app.get('/blogs/:id/edit', catchAsync(async(req,res) => {
    const blog = await Blog.findById(req.params.id);
    res.render('blogs/edit', {blog}); 
}))

app.put('/blogs/:id', catchAsync(async(req,res) => {
    const {id} = req.params;
    const blog = await Blog.findByIdAndUpdate(id,{...req.body.blog})
    res.redirect(`/blogs/${blog._id}`)
}))

app.delete('/blogs/:id', catchAsync(async (req,res) => {
    const {id} = req.params;
    await Blog.findByIdAndDelete(id);
    res.redirect('/blogs'); 
}))

app.post('/blogs/:id/comments', catchAsync(async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    const comment = new Comment(req.body.comment);
    blog.comments.push(comment);
    await comment.save();
    await blog.save();
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