let listProductHTML = document.querySelector('.listProduct');
let listCartHTML = document.querySelector('.listCart');
let iconCart = document.querySelector('.icon-cart');
let iconCartSpan = document.querySelector('.icon-cart span');
let body = document.querySelector('body');
let closeCart = document.querySelector('.close');
let backbutton = document.querySelector('.back-button');
let products = [];
let cart = [];

backbutton.addEventListener('click', () => {
    window.location.href='/';
});

iconCart.addEventListener('click', () => {
    body.classList.toggle('showCart');
})
closeCart.addEventListener('click', () => {
    body.classList.toggle('showCart');
})

const addDataToHTML = () => {
    products.forEach(product => {
        let newProduct = document.createElement('div');
        newProduct.dataset.id = product.id;
        newProduct.classList.add('item');
        newProduct.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h2>${product.name}</h2>
            <div class="price">Rp.${product.price}</div>
            <button class="addCart">Add To Cart</button>`;
        listProductHTML.appendChild(newProduct);
    });
};

listProductHTML.addEventListener('click', (event) => {
    let positionClick = event.target;
    if (positionClick.classList.contains('addCart')) {
        let id_product = positionClick.parentElement.dataset.id;
        addToCart(id_product);
    }
})

let isAddingToCart = false;

// Fungsi untuk menambahkan barang ke keranjang dan mengirim ke server
const addToCart = (productId) => {
    let product = products.find((p) => p.id.toString() === productId.toString());
    let productInCart = cart.find((item) => item.product_id === productId);

    if (productInCart) {
        productInCart.quantity += 1;
    } else {
        cart.push({
            product_id: productId,
            quantity: 1,
            price: product.price
        });
    }
    addCartToHTML();
    addCartToMemory();
    sendCartData(productId, 1);
};



// Fungsi untuk mengirim data keranjang ke server
const sendCartData = (productId, quantity) => {
    fetch('/add-to-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId: productId,
            quantity: quantity
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Item added to cart:', data);
        })
        .catch(error => {
            console.error('Could not add item to cart:', error);
        });
};

// Fungsi untuk memperbarui localStorage dengan data keranjang
const addCartToMemory = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
    addCartToHTML();
};


const addCartToHTML = () => {
    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    let totalPrice = 0;
    if (cart.length > 0) {
        cart.forEach(item => {
            totalQuantity += item.quantity;
            let positionProduct = products.findIndex((value) => value.id == item.product_id);
            let info = products[positionProduct];
            let itemTotalPrice = item.quantity * info.price;
            totalPrice += itemTotalPrice;

            let newItem = document.createElement('div');
            newItem.classList.add('item');
            newItem.dataset.id = item.product_id;
            listCartHTML.appendChild(newItem);
            newItem.innerHTML = `
                <div class="image">
                    <img src="${info.image}">
                </div>
                <div class="name">
                    ${info.name}
                </div>
                <div class="totalPrice">Rp.${itemTotalPrice.toLocaleString()}</div>
                <div class="quantity">
                    <span class="minus"><</span>
                    <span>${item.quantity}</span>
                    <span class="plus">></span>
                </div>
            `;
        });
    }
    iconCartSpan.innerText = totalQuantity;
    document.getElementById('totalPriceDisplay').innerText = `Rp.${totalPrice.toLocaleString()}`;
}


listCartHTML.addEventListener('click', (event) => {
    let positionClick = event.target;
    if (positionClick.classList.contains('minus') || positionClick.classList.contains('plus')) {
        let product_id = positionClick.parentElement.parentElement.dataset.id;
        let type = 'minus';
        if (positionClick.classList.contains('plus')) {
            type = 'plus';
        }
        changeQuantityCart(product_id, type);
    }
})


const changeQuantityCart = (product_id, type) => {
    let positionItemInCart = cart.findIndex((value) => value.product_id == product_id);
    if (positionItemInCart >= 0) {
        if (type === 'plus') {
            cart[positionItemInCart].quantity += 1;
            updateCartData(product_id, cart[positionItemInCart].quantity);
        } else {
            if (cart[positionItemInCart].quantity > 1) {
                cart[positionItemInCart].quantity -= 1;
            } else {
                // Jika kuantitas menjadi 0, hapus item dari array
                cart.splice(positionItemInCart, 1);
                // hapus item dari keranjang di server
                removeFromCart(product_id);
            }
        }
        addCartToHTML();
        addCartToMemory();
        // Kirim data yang diperbarui ke server
        updateCartData(product_id, cart[positionItemInCart].quantity);
    }
};

// Fungsi untuk mengirim data keranjang yang diperbarui ke server
const updateCartData = (productId, quantity) => {
    fetch('/update-cart-item', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId: productId,
            quantity: quantity
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Cart updated:', data);
            addCartToHTML(); // memastikan memperbarui UI setelah server mengonfirmasi pembaruan
        })
        .catch(error => {
            console.error('Could not update cart item:', error);
        });
};

// Fungsi untuk menghapus item dari keranjang pada server
const removeFromCart = (productId) => {
    fetch('/remove-from-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to remove item from cart');
            }
            return response.json();
        })
        .then(data => {
            console.log('Item removed from cart:', data);
            addCartToHTML();
            addCartToMemory();
        })
        .catch(error => {
            console.error('Failed to remove item from cart:', error);
        });
};


// Fungsi untuk menampilkan data di moodel konfirmasi pembayaran
function showConfirmationPayment() {
    const username = sessionStorage.getItem('username');
    let totalQuantity = 0;
    let totalPrice = 0;

    const cart = JSON.parse(localStorage.getItem('cart'));
    if (!cart || cart.length === 0) {
        alert('Keranjang belanja kosong');
        return;
    }

    console.log("Cart Items:", cart);

    cart.forEach(item => {
        totalQuantity += item.quantity;
        totalPrice += item.quantity * item.price;
        console.log(`Calculating: ${item.quantity} * ${item.price}`);
    });

    document.getElementById('usernameDisplay').innerText = username;
    document.getElementById('quantityDisplay').innerText = totalQuantity;
    document.getElementById('totalPriceDisplay').innerText = `${totalPrice.toLocaleString()}`;
    document.getElementById('paymentConfirmation').style.display = 'block';
}

// Tambahkan event listener untuk tombol Check Out
document.querySelector('.checkOut').addEventListener('click', showConfirmationPayment);


var closeButton = document.querySelector('.closePayment');
  var payment = document.getElementById('paymentConfirmation');

  closeButton.addEventListener('click', function() {
    payment.style.display = 'none';
  });

// Event listener untuk submit pembayaran
document.getElementById('submitPayment').addEventListener('click', function() {
    fetch('/clear-cart', {
        method: 'POST'
    }).then(response => {
        if (response.ok) {
            alert('Pembayaran berhasil!');
            localStorage.removeItem('cart');
            location.reload(); // Reload atau redirect
        } else {
            alert('Gagal memproses pembayaran.');
        }
    }).catch(error => {
        console.error('Error:', error);
    });
});

  


const initApp = () => {
    // get data product
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            products = data;
            addDataToHTML();
            if (localStorage.getItem('cart')) {
                cart = JSON.parse(localStorage.getItem('cart'));
                addCartToHTML();
            }
        })
        .catch(error => console.error('Failed to fetch products:', error));

}
initApp();