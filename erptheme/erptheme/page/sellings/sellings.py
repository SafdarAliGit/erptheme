import frappe

@frappe.whitelist()
def get_sellings():
    # Prepare data for the template
    context = {
        "orders": frappe.get_all("Sales Order", fields=["name", "customer", "grand_total"])
    }
    # Render the HTML template with the context data
    html = frappe.render_template("erptheme/page/sellings/templates/sellings.html", context)
    return html