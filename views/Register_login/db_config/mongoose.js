// config/db.js
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/MongoUsers')
    .then(() => console.log('connected database'))