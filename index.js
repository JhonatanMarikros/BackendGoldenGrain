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
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
// //MongoDB user
const User = require('./views/Register_login/schema_register/schema');
require('./views/db_config/mongoose')

//Cart
const Cart = require('./views/cart/schema_cart');

//admin
const fs = require('fs').promises;
const Product = require('./views/admin/product_schema');


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

//Menyediakan akses ke file-file yang terdapat di direktori 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//mengurai body dari permintaan HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    }
    next();
}

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function checkAdmin(req, res, next) {
    if (req.user.email === "admin123@gmail.com") {
        return next();
    }
    res.redirect('/');
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

app.get('/shopnow', checkAuthenticated, (request,response)=>{
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

//get Register
app.get('/register', (request, response) => {
    response.render('Register_login/register', { title: 'Register' })
})

//get Login
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
app.get('/admin', checkAuthenticated, checkAdmin, (request,response)=>{
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

        // Get ID tertinggi dari the database
        const lastDbProduct = await Product.findOne().sort({id: -1});

        // Tentukan ID maksimum yang digunakan di barang sebelumnya
        const maxFileId = fileProducts.length > 0 ? Math.max(...fileProducts.map(p => p.id)) : 0;
        const newId = Math.max(maxFileId, lastDbProduct ? lastDbProduct.id : 0) + 1;

        // Buat produk baru dengan ID berikutnya
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

        // Gabungkan kedua set produk
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
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server connect on port ${port}`);
})