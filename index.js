if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}


const express = require('express');
const app = express();
const port = 3000;
const path = require('path')
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');
// //MongoDB user
const User = require('./views/Register_login/schema_register/schema');
require('./views/Register_login/db_config/mongoose')



// passport
const passport = require('passport')
const initializePassport = require('./views/Register_login/passport-config')
initializePassport(passport, async email => {
    try {
        return await User.findOne({ email: email });
    } catch (error) {
        console.error(error);
        return null;
    }
}, async id => {
    try {
        return await User.findOne({ id: id });
    } catch (error) {
        console.error(error);
        return null;
    }
});

app.use(express.urlencoded({extended: false}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())


//ejs
app.set('view engine', 'ejs');
//Mengambil css nya agar bisa digunakan ke html/ejs
app.use(express.static('views'));
app.use(express.static('views/Register_login'));
const bodyParser = require('body-parser');
app.use(bodyParser.json());

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } 
    next();
}


app.get('/', (request,response)=>{
    response.render('index', { title: 'Golden Grain', user: request.user }); // request.user akan berisi informasi pengguna yang login
})

app.get('/home', (request, response)=>{
    response.render('index', {title: 'Golden Grain', user: request.user});
})

app.get('/aboutus', (request, response)=>{
    response.render('aboutus', {title: 'About Us', user: request.user});
})

app.get('/creations', (request,response)=>{
    response.render('creations', {title: 'The Creations', user: request.user})
})

app.get('/location', (request,response)=>{
    response.render('location', {title: 'Location', user: request.user})
})

app.get('/promo', (request,response)=>{
    response.render('promo', {title: 'Promo', user: request.user})
})

app.get('/contactus', (request,response)=>{
    response.render('contactus', {title: 'Contact Us', user: request.user})
})


//get Register and login
app.get('/register', (request,response)=>{
    response.render('Register_login/register', {title: 'Register'})
})
app.get('/login', checkNotAuthenticated, (request,response)=>{
    response.render('Register_login/login', {title: 'Login'})
})

//Post Register
app.post('/register', async(req, res)=>{
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        let newUser = new User({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        await newUser.save();
        console.log(newUser);
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


// Post Login
app.post('/login', passport.authenticate('local', { 
    failureRedirect: '/login', 
    failureFlash: true 
}), (req, res) => {
    console.log(req.body.email);
    console.log(req.body.password);
    res.redirect('/');
});


//Logout
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});


app.listen(port, ()=>{
    console.log("Server menyala di port 3000");
})