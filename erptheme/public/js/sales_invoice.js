frappe.listview_settings['Sales Invoice'] = {
    onload(listview) {
        // Avoid duplicate block insertion
        if (listview.page.custom_block_added) return;

        const blockHTML = `
            <div class="custom-list-block">
                <div class="custom-list-container">
                    <div class="custom-box">
                        <div class="box-title">Total Invoices</div>
                        <div class="box-value" id="invoice_count_box">0</div>
                    </div>
                    <div class="custom-box">
                        <div class="box-title">Total Amount</div>
                        <div class="box-value" id="invoice_total_box">0</div>
                    </div>
                    <div class="custom-box">
                        <div class="box-title">Unpaid</div>
                        <div class="box-value" id="unpaid_box">0</div>
                    </div>
                    <div class="custom-box">
                        <div class="box-title">Draft</div>
                        <div class="box-value" id="draft_box">0</div>
                    </div>
                </div>
            </div>
        `;

        // Insert block above list view
        listview.page.wrapper
            .querySelector('.standard-filter-section')  // area below the title bar
            .insertAdjacentHTML('afterend', blockHTML);

        // Add CSS once
        if (!document.getElementById('custom-list-block-style')) {
            const style = document.createElement('style');
            style.id = 'custom-list-block-style';
            style.textContent = `
                .custom-list-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    margin: 15px 0;
                }
                .custom-box {
                    flex: 1 1 200px;
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                    padding: 15px;
                    min-width: 180px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .custom-box:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
                }
                .custom-box .box-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #666;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .custom-box .box-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #333;
                }
            `;
            document.head.appendChild(style);
        }

        // Fetch data dynamically and fill values
        update_sales_invoice_list_block();

        listview.page.custom_block_added = true;
    }
};


// Utility function to fetch stats and fill boxes
function update_sales_invoice_list_block() {
    frappe.call({
        method: 'frappe.desk.reportview.get',
        args: {
            doctype: 'Sales Invoice',
            fields: ['count(name) as total', 'sum(grand_total) as total_amount'],
            filters: [],
            group_by: null
        },
        callback: function(r) {
            if (r.message.length) {
                const stats = r.message[0];
                document.getElementById('invoice_count_box').textContent = stats.total || 0;
                document.getElementById('invoice_total_box').textContent = format_currency(stats.total_amount || 0);
            }
        }
    });

    // Example: Unpaid count
    frappe.db.count('Sales Invoice', { filters: { outstanding_amount: ['>', 0] } })
        .then(count => {
            document.getElementById('unpaid_box').textContent = count;
        });

    // Example: Draft count
    frappe.db.count('Sales Invoice', { filters: { docstatus: 0 } })
        .then(count => {
            document.getElementById('draft_box').textContent = count;
        });
}

