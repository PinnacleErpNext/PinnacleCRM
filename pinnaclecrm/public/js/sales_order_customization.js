var original_sales_order_onload =
  frappe.listview_settings["Sales Order"].onload;

window.gstData = {};
frappe.listview_settings["Sales Order"] = {
  add_fields: [
    "base_grand_total",
    "customer_name",
    "currency",
    "delivery_date",
    "per_delivered",
    "per_billed",
    "status",
    "order_type",
    "name",
    "skip_delivery_note",
  ],
  get_indicator: function (doc) {
    if (doc.status === "Closed") {
      return [__("Closed"), "green", "status,=,Closed"];
    } else if (doc.status === "On Hold") {
      return [__("On Hold"), "orange", "status,=,On Hold"];
    } else if (doc.status === "Completed") {
      return [__("Completed"), "green", "status,=,Completed"];
    } else if (!doc.skip_delivery_note && flt(doc.per_delivered) < 100) {
      if (frappe.datetime.get_diff(doc.delivery_date) < 0) {
        return [
          __("Overdue"),
          "red",
          "per_delivered,<,100|delivery_date,<,Today|status,!=,Closed",
        ];
      } else if (flt(doc.grand_total) === 0) {
        return [
          __("To Deliver"),
          "orange",
          "per_delivered,<,100|grand_total,=,0|status,!=,Closed",
        ];
      } else if (flt(doc.per_billed) < 100) {
        return [
          __("To Deliver and Bill"),
          "orange",
          "per_delivered,<,100|per_billed,<,100|status,!=,Closed",
        ];
      } else {
        return [
          __("To Deliver"),
          "orange",
          "per_delivered,<,100|per_billed,=,100|status,!=,Closed",
        ];
      }
    } else if (
      flt(doc.per_delivered) === 100 &&
      flt(doc.grand_total) !== 0 &&
      flt(doc.per_billed) < 100
    ) {
      return [
        __("To Bill"),
        "orange",
        "per_delivered,=,100|per_billed,<,100|status,!=,Closed",
      ];
    } else if (doc.skip_delivery_note && flt(doc.per_billed) < 100) {
      return [__("To Bill"), "orange", "per_billed,<,100|status,!=,Closed"];
    }
  },
  onload: function (listview) {
    if (original_sales_order_onload) {
      original_sales_order_onload(listview);
    }

    let user_email = frappe.boot.user.email || frappe.session.user_email;
    if (user_email) {
      console.log("User Email:", user_email);
      if (
        ["abhishek.porwal@pinnaclefsa.co.in", "arjit@mytaxcafe.com"].includes(
          user_email
        )
      ) {
        console.log("Applying route options...");
        frappe.route_options = {
          custom_payment_mode: ["in", ["Credit", "Others"]],
        };

        listview.refresh();
      }
    }
  },
};
window.selectedSeries = "";

frappe.ui.form.on("Sales Order", {
  validate: function (frm) {
    if (frm.doc.naming_series && frm.doc.naming_series === "SO-G-.FY.-.#.") {
      frm.set_value("status", "To Bill");
    }
    if (
      frm.doc.custom_payment_mode == "Kotak" ||
      frm.doc.custom_payment_mode == "ICICI" ||
      frm.doc.custom_payment_mode == "Payment Gateway" ||
      frm.doc.custom_payment_mode == "Cash"
    ) {
      if (!frm.doc.custom_payment_reciept && !frm.doc.custom_reciept_number) {
        frappe.throw("Please provide reciept number or reciept anyone.");
      }
    }
  },
  naming_series: function (frm) {
    setCustomerId(frm);
    window.selectedSeries = frm.doc.naming_series;
    pinnaclecrm.utils.applyItemGroupFilter(frm);
    pinnaclecrm.utils.applyCustomerGroupFilter(frm, "customer");
    if (frm.doc.naming_series) {
      if (
        frm.doc.naming_series.includes("-A-") ||
        frm.doc.naming_series.includes("-G-")
      ) {
        frm.set_value("custom_sales_type", "Fresh");
        frm.set_df_property("custom_sales_type", "read_only", 1);
      } else if (
        frm.doc.naming_series.includes("-AR-") ||
        frm.doc.naming_series.includes("-GR-")
      ) {
        frm.set_value("custom_sales_type", "Renewal");
        frm.set_df_property("custom_sales_type", "read_only", 1);
      } else {
        frm.set_value("custom_sales_type", "");
        frm.set_df_property("custom_sales_type", "read_only", 0);
      }
    }
  },
  refresh: function (frm) {
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
            customer_type: "UN-Registered",
            customer_name: frm.doc.custom_unregistered_customer_name,
          },
        };
      });
    } else {
      frm.set_query("custom_customer_id", () => {
        return {
          filters: {
            customer_type: "Registered",
            customer: frm.doc.customer,
          },
        };
      });
    }
    if (frm.is_new()) {
      frm.set_value("naming_series", window.selectedSeries);
      frm.set_value("delivery_date", "2080-01-01");
      frm.add_custom_button("Create Customer from GSTIN", () => {
        fetchGstInDetails(frm);
      });
    }
    if (!frm.page.wrapper[0]) return;

    // Define the array of button labels that should be removed
    let buttonsToHide = [
      "Pick List",
      "Work Order",
      "Material Request",
      "Request For Raw Materials",
      "Purchase Order",
      "Project",
      "Payment Request",
    ];

    // Flag to indicate whether any unwanted button was removed
    let removed = false;

    // Create a MutationObserver to watch for changes in the page wrapper
    let observer = new MutationObserver((mutations, observerInstance) => {
      // Check if the inner toolbar exists
      if (frm.page.inner_toolbar) {
        // Find all dropdown items inside the dropdown menu
        frm.page.inner_toolbar
          .find(".dropdown-menu .dropdown-item")
          .each(function () {
            // Get the trimmed text of the button
            let btnText = $(this).text().trim();

            // Compare in a case-insensitive way:
            let shouldHide = buttonsToHide.some(
              (btn) => btn.toLowerCase() === btnText.toLowerCase()
            );

            // If the button's label matches one in our list, remove it
            if (shouldHide) {
              $(this).remove();
              removed = true;
            }
          });
      }

      // Disconnect the observer after making changes
      if (removed) {
        observerInstance.disconnect();
      }
    });

    // Start observing changes in the page wrapper element
    observer.observe(frm.page.wrapper[0], { childList: true, subtree: true });

    // Check if the document is new and the first item's prevdoc_docname exists
    if (
      frm.is_new() &&
      frm.doc.items &&
      frm.doc.items.length > 0 &&
      frm.doc.items[0].prevdoc_docname
    ) {
      frappe.db
        .get_value(
          "Property Setter",
          { doc_type: frm.doc.doctype, property: "options" },
          "value"
        )
        .then((res) => {
          if (res.message && res.message.value) {
            // Split the options into an array and trim each option
            let naming_series_array = res.message.value
              .split("\n")
              .map((option) => option.trim());

            // Find the appropriate naming series based on prevdoc_docname
            let prevdoc_name = frm.doc.items[0].prevdoc_docname;
            let selected_series = naming_series_array.find((item) => {
              if (prevdoc_name.includes("-A-") && item.includes("-A-"))
                return true;
              if (prevdoc_name.includes("-G-") && item.includes("-G-"))
                return true;
              if (prevdoc_name.includes("-D-") && item.includes("-D-"))
                return true;
              if (prevdoc_name.includes("-GR-") && item.includes("-GR-"))
                return true;
              if (prevdoc_name.includes("-AR-") && item.includes("-AR-"))
                return true;
              return false;
            });
            if (!selected_series) {
              frappe.show_alert({
                message: __("Series Migration Failed!"),
                indicator: "red",
              });
            }
            // Set the selected naming series or fallback to the first option
            frm.set_value(
              "naming_series",
              selected_series || naming_series_array[0]
            );

            // Make the naming series field read-only
            frm.set_df_property("naming_series", "read_only", true);
            pinnaclecrm.utils.applyItemGroupFilter(frm);
          } else {
            console.log("No options found for naming_series");
            frm.set_value("naming_series", "");
          }
        })
        .catch((err) => {
          console.error("Error fetching Property Setter:", err);
          frappe.msgprint({
            title: __("Error"),
            message: __("There was an issue fetching the Property Setter."),
            indicator: "red",
          });
          frm.set_value("naming_series", "");
        });
    } else {
      console.log("Document is not new or prevdoc_docname is not available.");
    }
  },
  customer: function (frm) {
    setCustomerId(frm);
  },
  custom_unregistered_customer_name: function (frm) {
    setCustomerId(frm);
  },
  onload: function (frm) {
    setCustomerId(frm);
    if (frm.doc.workflow_state === "Cancelled" && frm.doc.docstatus == 1) {
      frm.save("Cancel");
    }
  },
  on_submit: function (frm) {},
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
            // console.log(res);
            frm.set_value("customer", res.message.customer);
            markLeadConverted(frm);
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

function setCustomerId(frm) {
  if (frm.doc.custom_customer_name) {
    return;
  }
  if (
    (frm.doc.customer_name ===
      "UNREGISTERED CUSTOMER [WITHIN UP ] [API CUST]" ||
      frm.doc.customer_name ===
        "UNREGISTERED CUSTOMER [OUTSIDE UP ] [API CUST]" ||
      frm.doc.customer_name ===
        "UNREGISTERED CUSTOMER [OUTSIDE UP ] [GST CUST]" ||
      frm.doc.customer_name ===
        "UNREGISTERED CUSTOMER [WITHIN UP ] [GST CUST]") &&
    frm.doc.custom_unregistered_customer_name
  ) {
    frappe.db
      .get_list("Customer ID", {
        fields: ["customer_id"],
        filters: {
          customer_type: "UN-Registered",
          customer_name: frm.doc.custom_unregistered_customer_name || "",
        },
        limit: 1,
      })
      .then((cust_id) => {
        if (cust_id.length > 0) {
          frm.set_value("custom_customer_id", cust_id[0].customer_id);
          console.log(cust_id[0].customer_id);
        } else {
          frappe.msgprint("No matching Customer ID found.");
        }
      })
      .catch((err) => {
        console.error(err);
        frappe.msgprint("Error while fetching Customer ID.");
      });
  } else {
    frappe.db
      .get_list("Customer ID", {
        fields: ["customer_id"],
        filters: {
          customer_type: "Registered",
          customer: frm.doc.customer || "",
        },
        limit: 1,
      })
      .then((cust_id) => {
        if (cust_id.length > 0) {
          frm.set_value("custom_customer_id", cust_id[0].customer_id);
          console.log(cust_id[0].customer_id);
        }
        // else {
        //   frappe.msgprint("No matching Customer ID found.");
        // }
      })
      .catch((err) => {
        console.error(err);
        frappe.msgprint("Error while fetching Customer ID.");
      });
  }
}

function markLeadConverted(frm) {
  frappe.call({
    method: "pinnaclecrm.events.lead_conversion.mark_lead_converted",
    args: {
      doc: frm.doc,
    },
  });
}
