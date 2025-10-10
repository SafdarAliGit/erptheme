frappe.ready(function () {
    // Avoid adding multiple buttons
    if (document.getElementById('global-back-btn')) return;

    // Create the button
    const backBtn = document.createElement('button');
    backBtn.id = 'global-back-btn';
    backBtn.innerText = '← Back';
    backBtn.title = 'Go Back';
    backBtn.style.position = 'fixed';
    backBtn.style.bottom = '20px';
    backBtn.style.left = '20px';
    backBtn.style.zIndex = '1000';
    backBtn.style.background = '#4b7bec';
    backBtn.style.color = '#fff';
    backBtn.style.border = 'none';
    backBtn.style.padding = '8px 14px';
    backBtn.style.borderRadius = '8px';
    backBtn.style.cursor = 'pointer';
    backBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';

    // Back button action
    backBtn.addEventListener('click', function () {
        // Prefer frappe router if available, else fallback to browser history
        if (frappe && frappe.router && frappe.router.back) {
            frappe.router.back();
        } else {
            window.history.back();
        }
    });

    // Add to page
    document.body.appendChild(backBtn);
});
