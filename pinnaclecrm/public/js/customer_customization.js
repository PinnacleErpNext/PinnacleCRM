window.gstData = {};

frappe.ui.form.on("Customer", {
  refresh: function (frm) {
    disableCustomerForm(frm);
    if (frm.doc.customer_primary_address) {
      frm.refresh_field("customer_primary_address");
    }
    if (frm.is_new()) {
      // Add a custom button to the form
      frm.add_custom_button("Create Customer from GSTIN", () => {
        fetchGstInDetails(frm);
      });
      // frm.set_value("gst_category", "");
    }
    if (
      frm.doc.customer_name ===
        "UNREGISTERED CUSTOMER [WITHIN UP ] [API CUST]" ||
      frm.doc.customer_name ===
        "UNREGISTERED CUSTOMER [OUTSIDE UP ] [API CUST]" ||
      frm.doc.customer_name ===
        "UNREGISTERED CUSTOMER [OUTSIDE UP ] [GST CUST]" ||
      frm.doc.customer_name === "UNREGISTERED CUSTOMER [WITHIN UP ] [GST CUST]"
    ) {
      frm.set_query("custom_customer_id", () => {
        return {
          filters: {
            customer_type: "B2C",
          },
        };
      });
    } else {
      frm.set_query("custom_customer_id", () => {
        return {
          filters: {
            customer_type: "B2B",
            customer: frm.doc.name,
          },
        };
      });
    }
  },
  customer_name: function (frm) {
    let customerName = frm.doc.customer_name;
    if (customerName) {
      frm.set_value("customer_name", customerName.toUpperCase());
    }
  },
  after_save: function (frm) {
    if (
      Object.keys(window.gstData).length > 0 &&
      !frm.doc.customer_primary_address
    ) {
      frappe.call({
        method: "pinnaclecrm.api.create_customer_address",
        args: {
          gst_data: window.gstData,
          customer: frm.doc.name,
        },
        callback: (res) => {
          if (res.message.status === 200) {
            frm.reload_doc();
          }
        },
        error: (res) => {
          frappe.msgprint("Error creating customer address.");
        },
      });
    }
  },
  onload: function (frm) {
    disableCustomerForm(frm);
  },
});

function fetchGstInDetails(frm) {
  let gstDialog = new frappe.ui.Dialog({
    title: "Enter GST Details",
    fields: [
      {
        label: "GST IN",
        fieldname: "gstin",
        fieldtype: "Data",
        reqd: 1,
      },
      {
        label: "Fetch GST Details",
        fieldname: "fetch_gst_details",
        fieldtype: "Button",
        click: function () {
          renderGstDetails(gstDialog);
        },
      },
      {
        label: "Select Customer Name",
        fieldname: "customer_name",
        fieldtype: "Select",
        options: [],
        hidden: 1,
        reqd: 1,
      },
      {
        label: "Use This Name",
        fieldname: "use_this_name",
        fieldtype: "Button",
        hidden: 1,
        click: function () {
          setCustomerName(gstDialog, frm);
        },
      },
      {
        fieldname: "address_details",
        fieldtype: "Section Break",
      },
      {
        label: "Customer ID",
        fieldname: "cust_id",
        fieldtype: "Data",
        hidden: 1,
      },
      {
        label: "Customer Group",
        fieldname: "customer_group",
        fieldtype: "Link",
        options: "Customer Group",
        hidden: 1,
        reqd: 1,
      },
      {
        label: "GST Category",
        fieldname: "gst_category",
        fieldtype: "Select",
        options: [
          "Registered Regular",
          "Registered Composition",
          "Unregistered",
          "SEZ",
          "Overseas",
          "Deemed Export",
          "UIN Holders",
          "Tax Deductor",
          "Tax Collector",
          "Input Service Distributor",
        ],
        hidden: 1,
        reqd: 1,
      },
      {
        label: "Tax Category",
        fieldname: "tax_category",
        fieldtype: "Link",
        options: "Tax Category",
        hidden: 1,
        reqd: 1,
      },
      {
        fieldname: "col_brk",
        fieldtype: "Column Break",
        hidden: 1,
      },
      {
        label: "Address",
        fieldname: "address_html",
        fieldtype: "HTML",
        options: "",
      },
    ],
    primary_action_label: "Create Customer",
    primary_action: function () {
      let selected = gstDialog.get_value("customer_name");
      let select_field = gstDialog.get_field("customer_name");
      let cnm = "";
      if (selected.includes("Trade Name")) {
        cnm = select_field.tradeNam;
      } else if (selected.includes("Legal Name")) {
        cnm = select_field.lgnm;
      }
      console.log(gstDialog.get_value("gstin"));
      frm.set_value("customer_name", cnm);
      frm.set_value("custom_customer_id", gstDialog.get_value("cust_id"));
      frm.set_value("customer_group", gstDialog.get_value("customer_group"));
      frm.set_value("tax_category", gstDialog.get_value("tax_category"));
      frm.set_value("gst_category", gstDialog.get_value("gst_category"));
      frm.set_value("gstin", gstDialog.get_value("gstin"));
      frm.save();
      gstDialog.hide();
      frm.refresh_field("customer_primary_address");
    },
  });

  gstDialog.show();
}

function renderGstDetails(gstDialog) {
  let gstin = gstDialog.get_value("gstin");
  if (gstin && gstin.length === 15) {
    let fields = [
      "customer_name",
      "use_this_name",
      "cust_id",
      "customer_group",
      "tax_category",
      "gst_category",
      "col_brk",
    ];

    fields.forEach((field) => {
      let f = gstDialog.get_field(field);
      if (f) {
        f.df.hidden = 0;
        f.refresh();
      }
    });
    gstDialog.fields_dict.address_html.$wrapper.html(`
      <style>
        .loader {
          border: 8px solid #f3f3f3;
          border-top: 8px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div class="loader"></div>
    `);

    frappe.call({
      method: "pinnaclecrm.api.get_gstin_details",
      args: { gst_in: gstin },
      callback: function (res) {
        if (res.message.status === 409) {
          let fields = [
            "customer_name",
            "use_this_name",
            "cust_id",
            "customer_group",
            "tax_category",
            "gst_category",
            "col_brk",
          ];

          fields.forEach((field) => {
            let f = gstDialog.get_field(field);
            if (f) {
              f.df.hidden = 1;
              f.refresh();
            }
          });
          gstDialog.fields_dict.address_html.$wrapper.html(``);
          return frappe.msgprint({
            message: `Customer: ${res.message.customer} with gstin:${gstin} already exists.Create customer mannually.`,
            title: __("Warning"),
            indicator: "orange",
          });
        }
        if (res && res.message && res.message.data) {
          window.gstData = res.message.data;
          let gstData = res.message.data;
          let tradeNam = gstData.tradeNam;
          let lgnm = gstData.lgnm;
          if (gstData.pradr.addr.stcd === "Uttar Pradesh") {
            gstDialog.set_value("tax_category", "In-State");
          } else {
            gstDialog.set_value("tax_category", "Out-State");
          }
          gstDialog.fields_dict.address_html.$wrapper.html(`
          <p><strong>GSTIN:</strong> ${gstData.gstin}</p>
          <p><strong>Address Line 1:</strong> ${
            gstData.pradr.addr.bno || ""
          }</p>
          <p><strong>Address Line 2:</strong> ${gstData.pradr.addr.st || ""}</p>
          <p><strong>City:</strong> ${gstData.pradr.addr.dst || ""}</p>
          <p><strong>State:</strong> ${gstData.pradr.addr.stcd || ""}</p>
          <p><strong>Postal Code:</strong> ${gstData.pradr.addr.pncd || ""}</p>
        `);

          let select_field = gstDialog.get_field("customer_name");
          select_field.df.options = [
            `Trade Name: ${tradeNam}`,
            `Legal Name: ${lgnm}`,
          ];
          select_field.df.hidden = 0;

          // Store names for later use
          select_field.tradeNam = tradeNam;
          select_field.lgnm = lgnm;

          gstDialog.refresh();
        } else {
          frappe.msgprint("Failed to fetch GST details.");
        }
      },
      error: function () {
        frappe.msgprint("Error fetching GST details.");
      },
    });
  } else {
    frappe.msgprint("Please enter a valid 15-character GSTIN.");
  }
}

function setCustomerName(gstDialog, frm) {
  let selected = gstDialog.get_value("customer_name");
  let name = "";

  let select_field = gstDialog.get_field("customer_name");
  if (selected.includes("Trade Name")) {
    name = select_field.tradeNam;
  } else if (selected.includes("Legal Name")) {
    name = select_field.lgnm;
  }

  if (name) {
    frm.set_value("customer_name", name);
    frappe.msgprint(`Customer name set to: ${name}`);
    gstDialog.hide();
  } else {
    frappe.msgprint("Please select a valid name option.");
  }
}

function disableCustomerForm(frm) {
  if (
    !frappe.user.has_role("System Manager") &&
    frm.doc.name.includes("UNREGISTERED CUSTOMER")
  ) {
    frm.set_read_only();
  }
}
