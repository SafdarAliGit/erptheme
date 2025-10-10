

frappe.pages['sellings'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Selling Dashboard'
    });

    // Make a call to the server to get the rendered HTML
    frappe.call({
        method: "erptheme.erptheme.page.sellings.sellings.get_sellings",
        callback: function(r) {
            // Insert the server-returned HTML into the page
            $(page.main).html(r.message);
        }
    });
};