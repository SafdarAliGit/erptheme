// ================= Helper: extend listview event without fully overriding ================
function extend_listview_event(doctype, event, callback) {
  frappe.listview_settings[doctype] = frappe.listview_settings[doctype] || {};
  const old = frappe.listview_settings[doctype][event];
  frappe.listview_settings[doctype][event] = function(listview) {
    if (old) {
      try { old.call(this, listview); } catch (e) { console.error("old hook error:", e); }
    }
    try { callback.call(this, listview); } catch (e) { console.error("callback error:", e); }
  };
}

// ================= Get safe container to insert block ====================
function get_listview_container(listview) {
  // 1. listview.page.wrapper if it's a DOM element
  let w = listview.page && listview.page.wrapper;
  if (w) {
    if (typeof w.querySelector === "function") {
      // console.debug("Using listview.page.wrapper as container");
      return w;
    }
    // maybe wrapper is an object with .el (element)
    if (w.el && typeof w.el.querySelector === "function") {
      // console.debug("Using listview.page.wrapper.el as container");
      return w.el;
    }
  }
  // 2. try page.body or page.main (versions differ)
  if (listview.page) {
    if (listview.page.body && typeof listview.page.body.querySelector === "function") {
      // console.debug("Using listview.page.body");
      return listview.page.body;
    }
    if (listview.page.main && typeof listview.page.main.querySelector === "function") {
      // console.debug("Using listview.page.main");
      return listview.page.main;
    }
  }
  // 3. fallback global selector
  const fallback = document.querySelector(".layout-main-section");
  // console.debug("Using fallback container:", fallback);
  return fallback;
}

// ================= Insert block once if not present ======================
function insert_custom_block_once(listview) {
  try {
    if (document.querySelector(".custom-list-block")) {
      return;
    }
    const container = get_listview_container(listview);
    if (!container) {
      // container not ready, try again
      setTimeout(() => insert_custom_block_once(listview), 200);
      return;
    }

    const blockHTML = `
      <div class="custom-list-block">
        <div class="custom-header">
          <img id="company_logo"  alt="Company Logo">
          <div class="header-title" id="company_name_header">Company</div>
         <span id="company_brand" class="bullet"></span><br>
        </div>
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
            <div class="box-title">Draft</div>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforebegin", blockHTML);
    load_owner_info();
    update_sales_invoice_stats();

  } catch (err) {
    console.error("insert_custom_block_once error:", err);
  }
}

// ================= Observe container mutations to reinsert if removed ====================
function observe_layout_section(listview) {
  try {
    const container = get_listview_container(listview);
    if (!container) {
      setTimeout(() => observe_layout_section(listview), 200);
      return;
    }
    const observer = new MutationObserver((mutations) => {
      insert_custom_block_once(listview);
    });
    observer.observe(container, { childList: true, subtree: true });
  } catch (err) {
    console.error("observe_layout_section error:", err);
  }
}

// ================= Load company info ====================
function load_owner_info() {
  frappe.db.get_value("Owner", "Owner", ["company_name", "logo", "brand"])
    .then(r => {
      if (r.message) {
        const company_name = r.message.company_name;
        const logo = r.message.logo;
        const brand = r.message.brand;
        const hdr = document.getElementById("company_name_header");
        if (hdr && company_name) hdr.textContent = company_name;
        const img = document.getElementById("company_logo");
        if (img && logo) img.src = logo;
        const company_brand = document.getElementById("company_brand");
        if (company_brand && brand) company_brand.textContent = brand;
      }
    })
    .catch(error => {
      console.error("Error loading owner info:", error);
    });
}

// ================= Update stats ====================
function update_sales_invoice_stats() {
  frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "Sales Invoice",
      fields: ["name", "outstanding_amount"],
      filters: [] // Add your specific filters here if needed
    },
    callback: function(r) {
      if (r.message) {
        const invoices = r.message;
        const totalInvoices = invoices.length;
        
        // Calculate total outstanding amount, handling potential undefined values
        const totalOutstanding = invoices.reduce((sum, invoice) => {
          return sum + (parseFloat(invoice.outstanding_amount) || 0);
        }, 0);
  
        // Update the DOM
        const countElement = document.getElementById("invoice_count_box");
        const totalElement = document.getElementById("invoice_total_box");
        
        if (countElement) countElement.textContent = totalInvoices;
        if (totalElement) totalElement.textContent = totalOutstanding.toFixed(2);
      }
    }
  });
  frappe.db.count("Sales Invoice", { filters: { outstanding_amount: [">", 0] } })
    .then(c => {
      const e = document.getElementById("unpaid_box");
      if (e) e.textContent = c;
    });
  frappe.db.count("Sales Invoice", { filters: { docstatus: 0 } })
    .then(c => {
      const e = document.getElementById("draft_box");
      if (e) e.textContent = c;
    });
}

// ================= CSS injection ====================
if (!document.getElementById("custom-list-box-style")) {
  const style = document.createElement("style");
  style.id = "custom-list-box-style";
  style.textContent = `
    .custom-list-block { background-color: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 10px; }
    .custom-header { display: flex; align-items: center; gap: 12px; background: #ffffff; padding: 8px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 16px; }
    .custom-header img { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1); }
    .custom-header .header-title { font-size: 18px; font-weight: 600; color: #1f2937; }
    .custom-list-container { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 8px; }
    .custom-box { flex: 1 1 220px; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); padding: 16px 20px; min-width: 200px; transition: all 0.2s ease; display: flex; flex-direction: column; justify-content: center; }
    .custom-box:hover { transform: translateY(-3px); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12); }
    .custom-box .box-title { font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; text-align: center; }
    .custom-box .box-value { font-size: 22px; font-weight: 700; color: #1f2937; text-align: center; }
  `;
  document.head.appendChild(style);
}

// =============== Hook into ListView lifecycle ===============
extend_listview_event("Sales Invoice", "onload", function(listview) {
  insert_custom_block_once(listview);
  observe_layout_section(listview);
});
extend_listview_event("Sales Invoice", "refresh", function(listview) {
  insert_custom_block_once(listview);
});
extend_listview_event("Sales Invoice", "render", function(listview) {
  insert_custom_block_once(listview);
});
