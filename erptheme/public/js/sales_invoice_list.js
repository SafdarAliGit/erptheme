// ✅ Helper function to extend listview events without overriding existing ones
function extend_listview_event(doctype, event, callback) {
    if (!frappe.listview_settings[doctype]) {
        frappe.listview_settings[doctype] = {};
    }
    const old_event = frappe.listview_settings[doctype][event];
    frappe.listview_settings[doctype][event] = function (listview) {
        if (old_event) old_event(listview);
        callback(listview);
    };
}

// ✅ Add custom CSS once
if (!document.getElementById('custom-list-box-style')) {
    const style = document.createElement('style');
    style.id = 'custom-list-box-style';
    style.textContent = `
        .custom-list-block {
            background-color: #f8f9fa;
            padding: 12px;
            margin: 8px 0;
            border-radius: 10px;
        }

        /* Company header box (single image + name) */
        .custom-header {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #ffffff;
            padding: 8px 8px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            margin-bottom: 16px;
        }
        .custom-header img {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            object-fit: cover;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }
        .custom-header .header-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
        }

        /* Stats 4-box layout */
        .custom-list-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 8px;
        }
        .custom-box {
            flex: 1 1 220px;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            padding: 16px 20px;
            min-width: 200px;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .custom-box:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
        }
        .custom-box .box-title {
            font-size: 13px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
            text-align: center;
        }
        .custom-box .box-value {
            font-size: 22px;
            font-weight: 700;
            color: #1f2937;
            text-align: center; 
        }
    `;
    document.head.appendChild(style);
}

// ✅ Extend Sales Invoice listview onload event
extend_listview_event("Sales Invoice", "refresh", function (listview) {
    setTimeout(() => {
        if (listview.page.custom_block_added) return;

        // HTML structure: Company header block + 4-box block
        const blockHTML = `
            <div class="custom-list-block">
                <!-- Company Header Box -->
                <div class="custom-header">
                    <img id="company_logo" src="/assets/erptheme/images/merrix logo.png" alt="Company Logo">
                    <div class="header-title" id="company_name_header">Company Overview</div>
                </div>

                <!-- 4 Stats Boxes -->
                <div class="custom-list-container">
                    <div class="custom-box">
                       
                        <div class="box-value" id="invoice_count_box">0</div>
                         <div class="box-title">Total Invoices</div>
                    </div>
                    <div class="custom-box">
                       
                        <div class="box-value" id="invoice_total_box">0</div>
                         <div class="box-title">Total Amount</div>
                    </div>
                    <div class="custom-box">
                      
                        <div class="box-value" id="unpaid_box">0</div>
                          <div class="box-title">Unpaid</div>
                    </div>
                    <div class="custom-box">
                     <div class="box-value" id="draft_box">0</div>
                     
                         <div class="box-title">Status </div>
                       
                    </div>
                </div>
            </div>
        `;

        // Insert the custom block above the list view
        const targetElement = document.querySelector('.layout-main-section'); 
        if (targetElement) {
            targetElement.insertAdjacentHTML('beforebegin', blockHTML);
        }

        listview.page.custom_block_added = true;

        load_company_info();
        update_sales_invoice_stats();
    }, 500);
});

// ✅ Fetch and display company logo and name
function load_company_info() {
    const default_company = frappe.defaults.get_default('Company');
    if (!default_company) return;

    frappe.db.get_value('Company', default_company, ['company_name', 'company_logo'])
        .then(r => {
            if (r.message) {
                if (r.message.company_name) {
                    document.getElementById('company_name_header').textContent = r.message.company_name;
                }
                if (r.message.company_logo) {
                    document.getElementById('company_logo').src = r.message.company_logo;
                }
            }
        });
}

// ✅ Fetch and display dynamic stats
function update_sales_invoice_stats() {
    frappe.call({
        method: 'frappe.desk.reportview.get',
        args: {
            doctype: 'Sales Invoice',
            fields: ['count(name) as total', 'sum(outstanding_amount) as total_amount'],
            filters: [],
        },
        callback: function(r) {
            if (r.message && r.message.length) {
                const stats = r.message[0];
                document.getElementById('invoice_count_box').textContent = stats.total || 0;
                document.getElementById('invoice_total_box').textContent = format_currency(stats.total_amount || 0);
            }
        }
    });

    frappe.db.count('Sales Invoice', { filters: { outstanding_amount: ['>', 0] } })
        .then(count => document.getElementById('unpaid_box').textContent = count);

    frappe.db.count('Sales Invoice', { filters: { docstatus: 0 } })
        .then(count => document.getElementById('draft_box').textContent = count);
}
