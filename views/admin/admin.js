document.getElementById('product-form').addEventListener('submit', function(e) {
    e.preventDefault();

    let formData = new FormData(this);
    fetch('/admin/add-product', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        window.location.reload(); 
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
