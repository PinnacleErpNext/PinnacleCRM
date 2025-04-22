window.selectedSeries = "";

frappe.ui.form.on("Sales Invoice", {
  naming_series: function (frm) {
    pinnaclecrm.utils.applyItemGroupFilter(frm);
    window.selectedSeries = frm.doc.naming_series;
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
    }
    if (!frm.page.wrapper[0]) return; // Ensure the wrapper exists

    let observer = new MutationObserver((mutations, observer) => {
      let actionButton = frm.page.wrapper.find('[data-label="Action"]');
      let removed = false;

      if (actionButton.length) {
        actionButton.hide();
        removed = true;
      }

      // Remove specific inner buttons only if they exist
      ["Opportunity", "Customer", "Prospect"].forEach((btn) => {
        if (
          frm.page.inner_toolbar &&
          frm.page.inner_toolbar.find(`[data-label="${btn}"]`).length
        ) {
          frm.page.remove_inner_button(btn, "Create");
          removed = true;
        }
      });

      // Additional buttons to remove
      ["Dunning", "Maintenance Schedule", "Payment Request"].forEach((btn) => {
        if (
          frm.page.inner_toolbar &&
          frm.page.inner_toolbar.find(`[data-label="${btn}"]`).length
        ) {
          frm.page.remove_inner_button(btn, "Create");
          removed = true;
        }
      });

      // Hide e-Waybill button if present
      let eWaybillButton = frm.page.wrapper.find('[data-label="e-Waybill"]');
      if (eWaybillButton.length) {
        eWaybillButton.hide();
        removed = true;
      }

      // Disconnect observer after removing buttons to prevent unnecessary calls
      if (removed) {
        observer.disconnect();
      }
    });

    // Start observing only if wrapper exists
    observer.observe(frm.page.wrapper[0], { childList: true, subtree: true });
    const refrencedDoc =
      ("delivery_note" in frm.doc.items[0] && frm.doc.items[0].delivery_note) ||
      ("sales_order" in frm.doc.items[0] && frm.doc.items[0].sales_order);
    // Ensure that 'frm.doc.party_name' is available before proceeding

    if (frm.is_new() && refrencedDoc) {
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

              if (refrencedDoc.includes("-A-") && item.includes("-A-")) {
                selected_series = item;
                break; // Exit loop once a match is found
              } else if (refrencedDoc.includes("-G-") && item.includes("-G-")) {
                selected_series = item;
                break; // Exit loop once a match is found
              } else if (refrencedDoc.includes("-D-") && item.includes("-D-")) {
                selected_series = item;
                break; // Exit loop once a match is found
              } else if (
                refrencedDoc.includes("-GR-") &&
                item.includes("-GR-")
              ) {
                selected_series = item;
                break; // Exit loop once a match is found
              } else if (
                refrencedDoc.includes("-AR-") &&
                item.includes("-AR-")
              ) {
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
            frm.set_value(
              "naming_series",
              selected_series || frm.doc.naming_series
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
          frm.set_value("naming_series", "");
        });
    } else {
      console.log("Party name not available or naming series already set");
    }
  },
  customer: function (frm) {
    if (
      frm.doc.customer !== "UNREGISTERED CUSTOMER [WITHIN UP ] [API CUST]" &&
      frm.doc.customer !== "UNREGISTERED CUSTOMER [OUTSIDE UP ] [API CUST]" &&
      frm.doc.customer_name !==
        "UNREGISTERED CUSTOMER [OUTSIDE UP ] [GST CUST]" &&
      frm.doc.customer_name !== "UNREGISTERED CUSTOMER [WITHIN UP ] [GST CUST]"
    ) {
      setCustomerId(frm);
    }
  },
  custom_unregistered_customer_name: function (frm) {
    setCustomerId(frm);
  },
  onload: function (frm) {
    setCustomerId(frm);
  },
});

function setCustomerId(frm) {
  if (frm.doc.custom_customer_id) {
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
        }
        // else {
        //   frappe.msgprint("No matching Customer ID found.");
        // }
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
