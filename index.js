if (process.env.NODE_ENV !== 'production') {
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
require('./views/db_config/mongoose')

//Cart
const Cart = require('./views/cart/schema_cart');

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

app.use(express.urlencoded({ extended: false }));
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
app.use(express.static('views/cart'));
const bodyParser = require('body-parser');
app.use(bodyParser.json());

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    }
    next();
}


app.get('/', (request,response)=>{
    response.render('index', { title: 'Golden Grain', user: request.user });
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

app.get('/shopnow', (request,response)=>{
    response.render('cart/shopnow', {title: 'Shop Now', user: request.user})
})

app.get('/promo', (request,response)=>{
    response.render('promo', {title: 'Promo', user: request.user})
})
app.get('/contactus', (request,response)=>{
    response.render('contactus', {title: 'Contact Us', user: request.user})
})

app.get('/location', (req,res)=>{
    res.render('location', {title: 'Location', user: req.user})
})

//get Register and login
app.get('/register', (request, response) => {
    response.render('Register_login/register', { title: 'Register' })
})
app.get('/login', checkNotAuthenticated, (request, response) => {
    response.render('Register_login/login', { title: 'Login' })
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


//cart Post
app.post('/add-to-cart', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).send('User is not authenticated');
    }

    const { productId, quantity } = req.body;
    const userId = req.user._id.toString();

    try {
        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            // Jika tidak ada keranjang, buat yang baru
            cart = new Cart({
                userId,
                items: [{ productId, quantity }]
            });
        } else {
            let itemIndex = cart.items.findIndex(item => item.productId === productId);
            if (itemIndex > -1) {
                // Item sudah ada, tingkatkan kuantitasnya
                cart.items[itemIndex].quantity += quantity;
            } else {
                // Jika tidak, tambahkan item baru
                cart.items.push({ productId, quantity });
            }
        }
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/update-cart-item', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).send('User is not authenticated');
    }

    const { productId, quantity } = req.body;
    const userId = req.user._id.toString(); // Pastikan ini adalah ID yang benar

    try {
        // Cari keranjang dengan userId
        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        // Cari item dalam keranjang dengan productId
        let itemIndex = cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) {
            return res.status(404).send('Item not found in cart');
        }

        // Update kuantitas item
        cart.items[itemIndex].quantity = quantity;

        // Jika kuantitasnya lebih dari 0, update kuantitas item
        if (quantity > 0) {
            cart.items[itemIndex].quantity = quantity;
        } else {
            // Jika kuantitasnya 0, hapus item dari array items
            cart.items.splice(itemIndex, 1);
        }

        // Simpan perubahan ke database
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/remove-from-cart', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).send('User is not authenticated');
    }

    const { productId } = req.body;
    const userId = req.user._id.toString();

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        // Hapus item berdasarkan productId
        cart.items = cart.items.filter(item => item.productId != productId);

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.listen(port, () => {
    console.log(`Server connect on port ${port}`);
})