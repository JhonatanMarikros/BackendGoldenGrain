// config/db.js
const mongoose = require('mongoose');

//MongoAtlas
const URI = 'mongodb+srv://Jhonatan:20030824@cluster0.48diwrj.mongodb.net/MongoUser';

//MongoCompass
// const URI = 'mongodb://localhost:27017/MongoUser'
mongoose.connect(URI)
    .then(() => console.log('connected database'))
    .catch(e => console.log(`Error connect to database`))

