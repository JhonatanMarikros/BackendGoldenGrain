document.addEventListener('DOMContentLoaded', function () {
    const likeButtons = document.querySelectorAll('.like-button');

    likeButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Check user authentication status
            fetch('/check-auth')
                .then(response => response.json())
                .then(data => {
                    if (!data.isAuthenticated) {
                        // User tidak authenticated, redirect ke login page
                        window.location.href = '/login';
                    } else {
                        // User authenticated
                        const liked = this.style.color !== "red"; 
                        this.style.color = liked ? "red" : "grey";

                        // Send like status update ke server
                        fetch('/update-like-status', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                itemId: this.getAttribute('data-item-id'),
                                liked: liked
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.error) {
                                console.error('Error updating like status:', data.error);
                                this.style.color = liked ? "grey" : "red";
                            } else {
                                console.log('Like status updated successfully');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            this.style.color = liked ? "grey" : "red";
                        });
                    }
                })
                .catch(error => {
                    console.error('Error checking authentication:', error);
                });
        });
    });
});
