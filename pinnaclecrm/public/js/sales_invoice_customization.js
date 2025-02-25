frappe.ui.form.on("Sales Invoice", {
  refresh: function (frm) {
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

    // Ensure that 'frm.doc.party_name' is available before proceeding
    if (frm.is_new() && frm.doc.items[0].delivery_note) {
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

              if (
                frm.doc.items[0].sales_order.includes("-A-") &&
                frm.doc.items[0].delivery_note.includes("-A-") &&
                item.includes("-A-")
              ) {
                console.log(item);
                selected_series = item;
                break; // Exit loop once a match is found
              } else if (
                frm.doc.items[0].sales_order.includes("-G-") &&
                frm.doc.items[0].delivery_note.includes("-G-") &&
                item.includes("-G-")
              ) {
                console.log(item);
                selected_series = item;
                break; // Exit loop once a match is found
              } else if (
                frm.doc.items[0].sales_order.includes("-D-") &&
                frm.doc.items[0].delivery_note.includes("-D-") &&
                item.includes("-D-")
              ) {
                console.log(item);
                selected_series = item;
                break; // Exit loop once a match is found
              } else if (
                frm.doc.items[0].sales_order.includes("-GR-") &&
                frm.doc.items[0].delivery_note.includes("-GR-") &&
                item.includes("-GR-")
              ) {
                console.log(item);
                selected_series = item;
                break; // Exit loop once a match is found
              } else if (
                frm.doc.items[0].sales_order.includes("-AR-") &&
                frm.doc.items[0].delivery_note.includes("-AR-") &&
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
});
