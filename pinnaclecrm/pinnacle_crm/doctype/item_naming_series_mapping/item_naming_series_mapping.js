// Copyright (c) 2025, OTPL and contributors
// For license information, please see license.txt

frappe.ui.form.on("Item Naming Series Mapping", {
  select_doctype: function (frm) {
    // Update naming options when the select_doctype field changes
    set_naming_options(frm);
  },
});

frappe.ui.form.on("Item Map", {
  item_map_add: function (frm, cdt, cdn) {
    let row = frappe.get_doc(cdt, cdn); // Get the new row object
    set_naming_options(frm, row); // Pass the row to handle default value setting
  },
});

function set_naming_options(frm, row = null) {
  if (!frm.doc.select_doctype) {
    console.warn("Select Doctype is not set. Cannot fetch naming options.");
    return;
  }

  frappe.db
    .get_value(
      "Property Setter",
      { doc_type: frm.doc.select_doctype, property: "options" },
      "value"
    )
    .then((r) => {
      if (r.message && r.message.value) {
        // Dynamically update the options for the select_series field in the grid
        frm.fields_dict["item_map"].grid.update_docfield_property(
          "select_series", // Fieldname in the child doctype
          "options", // Property to update
          r.message.value.split("\n") // Split the options into an array
        );

        // If a row is passed, set the first option as the default value for the row
        if (row) {
          //   row.select_series = r.message.value.split("\n")[0];
          frm.refresh_field("item_map"); // Refresh the child table
        }
      } else {
        frm.fields_dict["item_map"].grid.update_docfield_property(
          "select_series", // Fieldname in the child doctype
          "options", // Property to update
          "No series available" // Split the options into an array
        );
        frm.refresh_field("item_map");
        frappe.show_alert(
          {
            message: __("No Naming series found!"),
            indicator: "red",
          },
          10
        );
      }
    })
    .catch((err) => {
      console.error("Error fetching Property Setter:", err);
    });
}
