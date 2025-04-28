window.selectedSeries = "";

frappe.ui.form.on("Quotation", {
  naming_series: function (frm) {
    pinnaclecrm.utils.applyItemGroupFilter(frm);
    window.selectedSeries = frm.doc.naming_series;
  },
  quotation_to: function (frm) {
    if (frm.doc.quotation_to === "Customer") {
      pinnaclecrm.utils.applyCustomerGroupFilter(frm, "party_name");
    }
  },
  refresh: function (frm) {
    if (frm.is_new()) {
      console.log(window.selectedSeries);
      frm.set_value("naming_series", window.selectedSeries);
      frm.add_custom_button("Create Customer from GSTIN", () => {
        fetchGstInDetails(frm);
      });
    }
    // Ensure that 'frm.doc.party_name' is available before proceeding
    if (frm.is_new() && frm.doc.party_name && frm.doc.quotation_to === "Lead") {
      let naming_series;
      console.log("Party Name:", frm.doc.party_name);
      frappe.db
        .get_value("Lead", frm.doc.party_name, "naming_series")
        .then((r) => {
          naming_series = r.message.naming_series;
          frappe.db
            .get_value(
              "Property Setter",
              { doc_type: frm.doc.doctype, property: "options" },
              "value"
            )
            .then((res) => {
              if (res.message && res.message.value) {
                // Split the options by newline and trim each option
                let naming_series_array = res.message.value
                  .split("\n")
                  .map((option) => option.trim());

                // Initialize a variable to track the selected series
                let selected_series;

                // Use a standard for loop to allow break statement
                for (let i = 0; i < naming_series_array.length; i++) {
                  let item = naming_series_array[i];

                  if (naming_series.includes("-A.") && item.includes("-A-")) {
                    console.log(item);
                    selected_series = item;
                    break; // Exit loop once a match is found
                  } else if (
                    naming_series.includes("-G.") &&
                    item.includes("-G-")
                  ) {
                    console.log(item);
                    selected_series = item;
                    break; // Exit loop once a match is found
                  } else if (
                    naming_series.includes("-D.") &&
                    item.includes("-D-")
                  ) {
                    console.log(item);
                    selected_series = item;
                    break; // Exit loop once a match is found
                  } else if (
                    naming_series.includes("-GR.") &&
                    item.includes("-GR-")
                  ) {
                    console.log(item);
                    selected_series = item;
                    break; // Exit loop once a match is found
                  } else if (
                    naming_series.includes("-AR.") &&
                    item.includes("-AR-")
                  ) {
                    console.log(item);
                    selected_series = item;
                    break; // Exit loop once a match is found
                  }
                }
                if (!selected_series) {
                  frappe.show_alert({
                    message: __("Series Migration Failed!"),
                    indicator: "red",
                  });
                }
                // Set the selected series as the naming series, or use the default
                frm.set_value("naming_series", selected_series);

                // Make the naming series field read-only
                frm.set_df_property("naming_series", "read_only", true);
                pinnaclecrm.utils.applyItemGroupFilter(frm);
              } else {
                console.log("No options found for naming_series");
                frm.set_value("naming_series", window.selectedSeries);
              }
            })
            .catch((err) => {
              console.error("Error fetching Property Setter:", err);
              frm.set_value("naming_series", window.selectedSeries);
            });
        });
    } else {
      console.log("Party name not available or naming series already set");
    }

    // extend make_sale_orde() function
    if (!frm.custom_make_sales_order_extended) {
      frm.custom_make_sales_order_extended = true; // Prevent multiple overrides

      erpnext.selling.QuotationController.prototype.make_sales_order =
        function () {
          var me = this;
          let has_alternative_item = this.frm.doc.items.some(
            (item) => item.is_alternative
          );
          if (has_alternative_item) {
            this.show_alternative_items_dialog();
          } else {
            frappe.model.open_mapped_doc({
              method: "pinnaclecrm.events.make_sales_order.make_sales_order",
              frm: cur_frm,
            });
          }
        };
    }
  },
});

frappe.ui.form.on("Quotation Item", {
  item_code: function (frm, cdt, cdn) {
    // 1) Define `row` before using it
    const row = locals[cdt][cdn];
    if (!row.item_code) return;

    frappe.call({
      method: "pinnaclecrm.api.get_uom",
      // 2) Now `row` is defined, so this works
      args: { item_code: row.item_code },
      callback: function (res) {
        if (!res.message) return;
        const allowed_uom = res.message;

        // Override the UOM query for this specific row
        frm.fields_dict["items"].grid.get_field("uom").get_query = function (
          doc,
          cdt2,
          cdn2
        ) {
          if (cdn2 === cdn) {
            return { filters: { name: ["in", allowed_uom] } };
          }
          return {};
        };

        // Refresh only that UOM cell so the filter is applied
        frm.fields_dict["items"].grid.grid_rows_by_docname[
          cdn
        ].fields_dict.uom.refresh();
      },
      error: function (err) {
        console.error(err);
      },
    });
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
      data = {
        gstin: gstDialog.get_value("gstin"),
        cnm: cnm,
        custid: gstDialog.get_value("cust_id"),
        cgrp: gstDialog.get_value("customer_group"),
        txcategory: gstDialog.get_value("tax_category"),
        bno: window.gstData.pradr?.addr?.bno,
        st: window.gstData.pradr?.addr?.st,
        dst: window.gstData.pradr?.addr?.dst,
        stcd: window.gstData.pradr?.addr?.stcd,
        pncd: window.gstData.pradr?.addr?.pncd,
      };
      frappe.call({
        method: "pinnaclecrm.api.create_customer",
        args: { data: data },
        callback: function (res) {
          if (res.message.status === 200) {
            console.log(res);
            frm.set_value("party_name", res.message.customer);
          }
        },
        error: function () {
          console.log(err);
          frappe.msgprint("Failed to fetch GST details.");
        },
      });
      gstDialog.hide();
    },
  });

  gstDialog.show();
}

function renderGstDetails(gstDialog) {
  let gstin = gstDialog.get_value("gstin");
  if (gstin && gstin.length === 15) {
    let fields = [
      "customer_name",
      "cust_id",
      "customer_group",
      "tax_category",
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
