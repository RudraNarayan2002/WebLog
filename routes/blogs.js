const express = require('express');
const router = express.Router();
const catchAsync = require('../Utils/catchAsync');
const ExpressError = require('../Utils/ExpressError');
const Blog = require('../models/blog');
const {isLoggedIn, isAuthor} = require('../middleware')


router.get('/', catchAsync(async(req,res) => {
    const blogs = await Blog.find({}).populate('author');
    res.render('blogs/index', {blogs});
}))

router.get('/new', isLoggedIn, (req,res) => {
    res.render('blogs/new');
})

router.post('/', isLoggedIn, catchAsync(async(req, res, next) => {
    if(!req.body.blog) throw new ExpressError('Invalid Blog Data', 400);
    const blog = new Blog(req.body.blog);
    blog.author = req.user._id;
    await blog.save();
    req.flash('success', 'Successfully made a new blog!');
    res.redirect(`/blogs/${blog._id}`)
}))

router.get('/:id', catchAsync(async(req,res) => {
    const blog = await Blog.findById(req.params.id).populate({
        path: 'comments',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if(!blog) {
        req.flash('error', 'Cannot find that blog!');
        return res.redirect('/blogs');
    }
    res.render('blogs/show', {blog});
}))

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(async(req,res) => {
    const {id} = req.params;
    const blog = await Blog.findById(id);
    if(!blog) {
        req.flash('error', 'Cannot find that blog!');
        return res.redirect('/blogs');
    }
    res.render('blogs/edit', {blog}); 
}))

router.put('/:id',isLoggedIn, isAuthor, catchAsync(async(req,res) => {
    const {id} = req.params;
    const blog = await Blog.findByIdAndUpdate(id,{...req.body.blog})
    req.flash('success', 'Successfully updated blog!')
    res.redirect(`/blogs/${blog._id}`)
}))

router.delete('/:id', isLoggedIn, isAuthor, catchAsync(async (req,res) => {
    const {id} = req.params;
    await Blog.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted blog!');
    res.redirect('/blogs'); 
}))

module.exports = router;