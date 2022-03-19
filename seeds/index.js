const { urlencoded } = require('express');
const mongoose = require('mongoose');
const Blog = require('../models/blog');
const names = require('./names');
const title = require('./titles');

mongoose.connect('mongodb://localhost:27017/blog-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Blog.deleteMany({});
    for( let i = 0; i < 20; i++) {
        const random30 = Math.floor(Math.random() * 30);
        const blog = new Blog({
           author: '6231d403110cdb62602795ad',
           title: `${sample(title)}`,
           description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
        //    image: 'https://source.unsplash.com/collection/483251'
           image: 'https://static.teamguru.com/data/images/thumb/180_da8e22ef6e.jpg'
        })
        await blog.save();
    }
}
seedDB().then(() => {
    mongoose.connection.close();
})