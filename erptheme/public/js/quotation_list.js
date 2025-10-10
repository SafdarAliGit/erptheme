// ================= Helper: extend listview event without fully overriding ================
function extend_listview_event(doctype, event, callback) {
  frappe.listview_settings[doctype] = frappe.listview_settings[doctype] || {};
  const old = frappe.listview_settings[doctype][event];
  frappe.listview_settings[doctype][event] = function (listview) {
    if (old) {
      try { old.call(this, listview); } catch (e) { console.error("old hook error:", e); }
    }
    try { callback.call(this, listview); } catch (e) { console.error("callback error:", e); }
  };
}

// ================= Get safe container to insert block ====================
function get_listview_container(listview) {
  let w = listview.page && listview.page.wrapper;
  if (w) {
    if (typeof w.querySelector === "function") return w;
    if (w.el && typeof w.el.querySelector === "function") return w.el;
  }
  if (listview.page) {
    if (listview.page.body && typeof listview.page.body.querySelector === "function") {
      return listview.page.body;
    }
    if (listview.page.main && typeof listview.page.main.querySelector === "function") {
      return listview.page.main;
    }
  }
  return document.querySelector(".layout-main-section-wrapper");
}

// ================= Insert custom block ======================
function insert_custom_block(listview) {
  const existing = document.querySelector(".layout-main-section-wrapper");
  // if (existing) existing.remove(); // ensure fresh insert

  const container = get_listview_container(listview);
  if (!container) {
    setTimeout(() => insert_custom_block(listview), 200);
    return;
  }

  const blockHTML = `
  <div class="custom-list-block">
    <div class="custom-header">
      <img id="company_logo" alt="Company Logo">
      <div class="header-title" id="company_name_header">Company</div>
      <span id="company_brand" class="bullet"></span><br>
    </div>
    <div class="custom-list-container">
      <div class="custom-box">
        <div class="box-left">
          <div class="box-value" id="invoice_count_box">0</div>
          <div class="box-title">Total Invoices</div>
        </div>
        <div class="box-right">
          <img src="/assets/erptheme/images/countdown.png" alt="icon" style="width: 42px; height: 42px;">
        </div>
      </div>
      <div class="custom-box">
        <div class="box-left">
          <div class="box-value" id="invoice_total_box">0</div>
          <div class="box-title">Total Amount</div>
        </div>
        <div class="box-right">
          <img src="/assets/erptheme/images/currency.png" alt="icon" style="width: 42px; height: 42px;">
        </div>
      </div>
      <div class="custom-box">
        <div class="box-left">
          <div class="box-value" id="unpaid_box">0</div>
          <div class="box-title">Unpaid</div>
        </div>
        <div class="box-right">
          <img src="/assets/erptheme/images/unpaid.png" alt="icon" style="width: 42px; height: 42px;">
        </div>
      </div>
      <div class="custom-box">
        <div class="box-left">
          <div class="box-value" id="draft_box">0</div>
          <div class="box-title">Draft</div>
        </div>
        <div class="box-right">
          <img src="/assets/erptheme/images/draft.png" alt="icon" style="width: 42px; height: 42px;">
        </div>
      </div>
    </div>
  </div>
`;


  container.insertAdjacentHTML("afterbegin", blockHTML);
  load_owner_info();
  update_quotation_stats();
}

// ================= Observe container mutations to reinsert if removed ====================
function observe_layout_section(listview) {
  const container = get_listview_container(listview);
  if (!container) {
    setTimeout(() => observe_layout_section(listview), 200);
    return;
  }
  const observer = new MutationObserver(() => {
    if (!document.querySelector(".layout-main-section-wrapper")) {
      insert_custom_block(listview);
    }
  });
  observer.observe(container, { childList: true, subtree: true });
}

// ================= Load company info ====================
function load_owner_info() {
  frappe.db.get_value("Owner", "Owner", ["company_name", "logo", "brand"])
    .then(r => {
      if (r.message) {
        const { company_name, logo, brand } = r.message;
        const hdr = document.getElementById("company_name_header");
        if (hdr && company_name) hdr.textContent = company_name;
        const img = document.getElementById("company_logo");
        if (img && logo) img.src = logo;
        const company_brand = document.getElementById("company_brand");
        if (company_brand && brand) company_brand.textContent = brand;
      }
    })
    .catch(error => console.error("Error loading owner info:", error));
}

// ================= Update stats ====================
function update_quotation_stats() {
  frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "Quotation",
      fields: ["name", "rounded_total"],
      filters: []
    },
    callback: function (r) {
      if (r.message) {
        const invoices = r.message;
        const totalInvoices = invoices.length;
        const totalOutstanding = invoices.reduce((sum, inv) => sum + (parseFloat(inv.rounded_total) || 0), 0);

        const countEl = document.getElementById("invoice_count_box");
        const totalEl = document.getElementById("invoice_total_box");
        if (countEl) countEl.textContent = totalInvoices ;
        if (totalEl) totalEl.textContent = totalOutstanding.toFixed(2);
      }
    }
  });

  // frappe.db.count("Quotation", { filters: { outstanding_amount: [">", 0] } })
  //   .then(c => {
  //     const e = document.getElementById("unpaid_box");
  //     if (e) e.textContent = c;
  //   });

  frappe.db.count("Quotation", { filters: { docstatus: 0 } })
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
    .custom-list-block {
  background-color: #f8f9fa;
  padding: 12px;
  margin: 8px 0;
  border-radius: 10px;
}

.custom-header {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  padding: 8px;
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

.custom-list-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 8px;
}

.custom-box {
  position: relative;
  flex: 1 1 220px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px 20px 20px;
  min-width: 220px;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between; /* split left/right */
  align-items: center;
  overflow: hidden;
}

/* bottom animated line */
.custom-box::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  height: 6px;
  width: 100%;
  background: linear-gradient(90deg, #4b7bec, #34d399, #f59e0b, #ef4444);
  background-size: 300% 100%;
  transition: background-position 0.5s ease, height 0.3s ease;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}
.custom-box:hover::after {
  background-position: 100% 0;
  height: 8px;
}
.custom-box:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

/* left side (70%) */
.box-left {
  width: 70%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
}

/* right side (30%) */
.box-right {
  width: 30%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.box-right img {
  max-width: 100%;
  max-height: 48px;
  object-fit: contain;
  opacity: 0.85;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.custom-box:hover .box-right img {
  transform: scale(1.1);
  opacity: 1;
}

.box-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
  text-align:center;
}

.box-value {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
}


  `;
  document.head.appendChild(style);
}

// =============== Hook into ListView lifecycle ===============
extend_listview_event("Quotation", "onload", function (listview) {
  insert_custom_block(listview);
  observe_layout_section(listview);
  update_quotation_stats();
});



// =============== Handle Frappe route changes (SPA) ===============

// Silent page reload once after DOM load
if (sessionStorage.getItem('pageReloaded') !== 'true') {
  sessionStorage.setItem('pageReloaded', 'true');
  
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
          setTimeout(function() {
              window.location.reload();
          }, 200);
      });
  } else {
      setTimeout(function() {
          window.location.reload();
      }, 200);
  }
} else {
  sessionStorage.removeItem('pageReloaded');
}