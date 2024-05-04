if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}


const express = require('express');
const app = express();
const port = 3000;
const path = require('path')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
//MongoDB user
const User = require('./views/Register_login/schema_register/schema');
require('./views/db_config/mongoose')

//Cart
const Cart = require('./views/cart/schema_cart');

//admin
const fs = require('fs').promises;
const Product = require('./views/admin/product_schema');

//Like
const Like = require('./views/Tombol/LikeSchema');

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const bodyParser = require('body-parser');
app.use(bodyParser.json());

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    }
    next();
}

//Endurance checkAuthenticated
function checkAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next();
}


function checkAdmin(req, res, next) {
    if (req.user.email === "admin123@gmail.com") {
        return next();
    }
    res.redirect('/');
}


app.get('/', (request, response) => {
    response.render('index', { title: 'Golden Grain', user: request.user });
})
app.get('/home', (request, response) => {
    response.render('index', { title: 'Golden Grain', user: request.user });
})
app.get('/aboutus', (request, response) => {
    response.render('aboutus', { title: 'About Us', user: request.user });
})
app.get('/creations', (request, response) => {
    response.render('creations', { title: 'The Creations', user: request.user, items: arrayOfItems })
})

app.get('/shopnow', checkAuthenticated, (request, response) => {
    response.render('cart/shopnow', { title: 'Shop Now', user: request.user })
})

app.get('/promo', (request, response) => {
    response.render('promo', { title: 'Promo', user: request.user })
})
app.get('/contactus', (request, response) => {
    response.render('contactus', { title: 'Contact Us', user: request.user })
})

app.get('/location', (req, res) => {
    res.render('location', { title: 'Location', user: req.user })
})

//get Register
app.get('/register', (request, response) => {
    response.render('Register_login/register', { title: 'Register' })
})

//get Login
app.get('/login', checkNotAuthenticated, (request, response) => {
    response.render('Register_login/login', { title: 'Login' })
})

//Post Register
app.post('/register', async (req, res) => {
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
    if (req.user.email === "admin123@gmail.com") {
        res.redirect('/admin'); // redirect ke admin page
    } else {
        res.redirect('/home');  // Redirect ke page utama
    }
});


//Logout
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

//Admin.get
app.get('/admin', checkAuthenticated, checkAdmin, (request, response) => {
    response.render('admin/admin');
})

//admin.post database
app.post('/admin/add-product', upload.single('image'), async (req, res) => {
    try {
        const { name, price } = req.body;
        const image = req.file;
        if (!image) {
            throw new Error('Image file is required.');
        }
        const imagePath = `/uploads/${image.filename}`;

        // Baca produk yang ada dari file JSON
        const fileProductsRaw = await fs.readFile('views/cart/products.json', 'utf8');
        const fileProducts = JSON.parse(fileProductsRaw);

        const lastDbProduct = await Product.findOne().sort({ id: -1 });

        const maxFileId = fileProducts.length > 0 ? Math.max(...fileProducts.map(p => p.id)) : 0;
        const newId = Math.max(maxFileId, lastDbProduct ? lastDbProduct.id : 0) + 1;

        const newProduct = await Product.create({ id: newId, name, price, image: imagePath });
        await newProduct.save();
        res.redirect('/admin');
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});


//admin.get upload product
app.get('/api/products', async (req, res) => {
    try {
        // Fetch products dari database
        const dbProducts = await Product.find();

        // membaca produk dari file product.json
        const fileProductsRaw = await fs.readFile('views/cart/products.json', 'utf8');
        const fileProducts = JSON.parse(fileProductsRaw);

        const combinedProducts = [...fileProducts, ...dbProducts.map(product => product.toObject())];

        res.json(combinedProducts);
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
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
        res.status(500).send('Internal Server Error');
    }
});


app.post('/update-cart-item', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).send('User is not authenticated');
    }

    const { productId, quantity } = req.body;
    const userId = req.user._id.toString(); 

    try {
        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        let itemIndex = cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) {
            return res.status(404).send('Item not found in cart');
        }

        cart.items[itemIndex].quantity = quantity;
        if (quantity > 0) {
            cart.items[itemIndex].quantity = quantity;
        } else {
            cart.items.splice(itemIndex, 1);
        }
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
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
        cart.items = cart.items.filter(item => item.productId != productId);

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


//post clear cart ketika sudah di submit payment
app.post('/clear-cart', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).send('User is not authenticated');
    }

    try {
        const userId = req.user._id.toString();
        await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });
        res.send('Cart cleared');
    } catch (error) {
        console.error('Failed to clear cart:', error);
        res.status(500).send('Internal Server Error');
    }
});



//LIKES FAVORITE
// Endurance ketika user like product, diminta untuk login
app.get('/check-auth', (req, res) => {
    res.json({ isAuthenticated: req.isAuthenticated() });
});



app.post('/update-like-status', async (req, res) => {
    const { itemId, liked } = req.body;
    const userId = req.user._id;

    try {
        const productExists = arrayOfItems.some(item => item._id.toString() === itemId);
        if (!productExists) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const update = liked ? { $addToSet: { products: itemId } } : { $pull: { products: itemId } };
        const userLike = await Like.findOneAndUpdate({ user: userId }, update, { new: true, upsert: true });

        if (!userLike) {
            return res.status(404).json({ error: 'Failed to update like status.' });
        }
        
        res.json({ status: 'success', userLike: userLike.products.map(id => arrayOfItems.find(item => item._id.toString() === id)) });
    } catch (error) {
        console.error('Error updating like status:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});


//Item dari Produk untuk Like
const arrayOfItems = [
    { _id: 1, name: 'CORNETTI', imagePath: 'img/1.png' },
    { _id: 2, name: 'CREAMPUFF', imagePath: 'img/2.png' },
    { _id: 3, name: 'PASTRY', imagePath: 'img/3.png' },
    { _id: 4, name: 'CROMBOLONI', imagePath: 'img/4.png' },
    { _id: 5, name: 'PUFF PASTRY', imagePath: 'img/5.png' },
    { _id: 6, name: 'ISOLATED PASTRY PUFF', imagePath: 'img/6.png' },
    { _id: 7, name: 'BAKERS DELIGHT', imagePath: 'img/7.png' },
    { _id: 8, name: 'PAIN AU CHOCOLATE', imagePath: 'img/8.png' },
    { _id: 9, name: 'CHOCOLATE ECLAIR', imagePath: 'img/9.png' },
    { _id: 10, name: 'PUFF PASTRY COOKIE CRISPY', imagePath: 'img/10.png' },
    { _id: 11, name: 'SFOGLIATINE', imagePath: 'img/11.png' },
    { _id: 12, name: 'PIE CRUSTY', imagePath: 'img/12.png' },
    { _id: 13, name: 'BAGEL', imagePath: 'img/13.png' },
    { _id: 14, name: 'MUFIN', imagePath: 'img/14.png' },
    { _id: 15, name: 'FLAK PASTRY BITES', imagePath: 'img/15.png' },
    { _id: 16, name: 'BANANA CHOCO CHEESE', imagePath: 'img/16.png' },
    { _id: 17, name: 'CHEESE BUN', imagePath: 'img/17.png' },
    { _id: 18, name: 'CHOCO BUN', imagePath: 'img/18.png' },
    { _id: 19, name: 'ALMOND CROISANT', imagePath: 'img/19.png' },
    { _id: 20, name: 'JAPANESE CHEESE CAKE', imagePath: 'img/20.png' },
    { _id: 21, name: 'DOUBLE CHEESE CROISANT', imagePath: 'img/21.png' },
    { _id: 22, name: 'KOREAN GARLIC BREAD', imagePath: 'img/22.png' },
    { _id: 23, name: 'CHOCO CORNET', imagePath: 'img/23.png' },
    { _id: 24, name: 'CEREAL MILKY RING', imagePath: 'img/24.png' },
];

app.listen(port, () => {
    console.log(`Server connect on port ${port}`);
})