document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backBtn');

    backBtn.addEventListener('click', () => {
        // Navigate back to settings page
        window.location.href = 'settings.html';
    });
});
