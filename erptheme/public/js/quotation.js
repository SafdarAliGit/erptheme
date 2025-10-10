frappe.ui.form.on('Quotation', { // e.g., 'Sales Invoice'
    refresh: function(frm) {
        // Add a custom button to the form
        frm.add_custom_button(__('<- Go Back'), function() {
            // Use the browser's history to go back
            window.history.back();
        }).addClass('btn-primary'); // Optional: style the button
    }
});