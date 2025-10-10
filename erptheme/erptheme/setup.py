import frappe
from frappe import _
from erptheme.erptheme.utils.workspace import update_workspace_custom_block

def after_migrate():
    """
    Hook: called after `bench migrate`.
    Ensures workspace custom block is up to date / installed.
    Should be idempotent.
    """
    try:
        html = """
            <div class="selling-block">
                <h3>Sales Overview</h3>
                <div id="sales-metrics"></div>
            </div>
        """
        css = """
            .selling-block { background-color: #eef; padding: 15px; border-radius: 6px; }
        """
        js = """
        frappe.call({
            method: "my_app.api.get_sales_summary",
            callback: r => {
                if(r.message) {
                    document.getElementById("sales-metrics").innerText =
                        "Total Sales: " + r.message.total;
                }
            }
        });
        """

        # replace_all=False so that we don't wipe out any manually added blocks in that workspace
        update_workspace_custom_block("Selling", "Selling Summary Block", html, css, js, replace_all=False)

    except Exception as e:
        frappe.log_error(f"Error in after_migrate hook: {e}", "my_app.after_migrate")
