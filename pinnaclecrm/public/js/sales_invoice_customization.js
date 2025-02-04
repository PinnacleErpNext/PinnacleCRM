frappe.ui.form.on("Sales Invoice", {
  refresh: function (frm) {
    console.log("Triggered! from SI");

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
            let selected_series = null;

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
              }
            }

            // Set the selected series as the naming series, or use the default
            frm.set_value(
              "naming_series",
              selected_series || naming_series_array[0]
            );

            // Make the naming series field read-only
            frm.set_df_property("naming_series", "read_only", true);
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
  onload: function (frm) {
    setTimeout(function () {
      frm.page.remove_inner_button("Dunning", "Create");
      frm.page.remove_inner_button("Maintenance Schedule", "Create");
      frm.page.remove_inner_button("Payment Request", "Create");
      frm.page.wrapper.find('[data-label="e-Waybill"]').hide();
    }, 100);
  },
});
