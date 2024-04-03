const express = require('express');
const app = express();

const port = 3000; 

app.set('view engine', 'ejs');

app.get('/', (request,response)=>{
    response.render('index', {title: 'Golden Grain'});
})

app.get('/home', (request, response)=>{
    response.render('index', {title: 'Golden Grain'});
})

app.get('/promo', (request,response)=>{
    response.render('promo', {title: 'Promo'})
})

//Mengambil css nya agar bisa digunakan ke html/ejs
app.use(express.static('views'));

app.listen(port, ()=>{
    console.log("Server menyala di port 3000");
})