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
