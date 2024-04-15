// Fungsi untuk menginisialisasi fungsionalitas slider
const initSlider = () => {
    // Mendapatkan/Menangkap elemen-elemen menggunakan DOM
    const imageList = document.querySelector(".slider-wrapper .image-list");// Mendapatkan class slider-wrapper, image-list
    const slideButtons = document.querySelectorAll(".slider-wrapper .slide-button");// Mendapatkan class slider-wrapper slide button
    // Menghitung jumlah maksimum untuk menggeser secara horizontal
    const maxScrollLeft = imageList.scrollWidth - imageList.clientWidth;

    // Fungsi untuk menangani penggeseran ketika tombol diklik
    slideButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Menentukan arah berdasarkan tombol yang diklik
            const direction = button.id === "sebelum-slide" ? -1 : 1;
            // Menghitung jumlah untuk digeser berdasarkan lebar gambar dan arah
            const scrollAmount = imageList.clientWidth * direction;
            // Menggeser dengan lancar sejumlah yang dihitung
            imageList.scrollBy({ left: scrollAmount, behavior: "smooth" });
        });
    });

    // Fungsi untuk mengatur tampilan tombol penggeser berdasarkan posisi scroll
    const handleSlideButtons = () => {
        // Menyembunyikan atau menampilkan tombol kiri berdasarkan posisi scroll
        slideButtons[0].style.display = imageList.scrollLeft <= 0 ? "none" : "block";
        // Menyembunyikan atau menampilkan tombol kanan berdasarkan posisi scroll mencapai maksimum
        slideButtons[1].style.display = imageList.scrollLeft >= maxScrollLeft ? "none" : "block";

    }
     // Menambahkan event listener untuk menyesuaikan tombol penggeser saat terjadi pengguliran
    imageList.addEventListener("scroll", () => {
        handleSlideButtons();
    });
}

// Menginisialisasi slider saat window dimuat
window.addEventListener("load", initSlider);

function showCustomPopup(card) {
    var customPopup = document.getElementById("custom-popup");
    var popupImage = document.getElementById("popup-image");
    var popupPrice = document.getElementById("popup-price");
    
    // Mendapatkan konten dari store card yang diklik
    var cardImage = card.querySelector("img").src;
    var cardPrice = card.querySelector(".harga-store h5").innerText;
    
    // Mengisi konten popup dengan konten dari store card yang diklik
    popupImage.src = cardImage;
    popupPrice.innerText = cardPrice;
    
    customPopup.style.display = "block";
    popupImage.style.width = "330px";
}

function closeCustomPopup() {
    var customPopup = document.getElementById("custom-popup");
    customPopup.style.display = "none";
}

function addToCartFromPopup() {
    // Mendapatkan informasi produk dari popup
    var productInfo = document.getElementById("popup-price").innerText;

    // Lakukan apa pun yang diperlukan dengan informasi produk, misalnya tambahkan ke cart
    // Di sini Anda bisa menambahkan logika untuk menambahkan produk ke cart Anda
    console.log("Produk ditambahkan ke cart:", productInfo);

    // Tutup popup setelah menambahkan ke cart
    closeCustomPopup();
}

function removeFromCart() {
    // Lakukan apa pun yang diperlukan untuk menghapus produk dari cart
    // Di sini Anda bisa menambahkan logika untuk menghapus produk dari cart Anda

    // Tambahkan logika untuk menghapus produk dari cart

    // Tutup popup setelah menghapus dari cart
    closeCustomPopup();
}

// Simpan data ke localStorage
localStorage.setItem('cart', JSON.stringify(cartData));

// Ambil data dari localStorage
const cartData = JSON.parse(localStorage.getItem('cart'));