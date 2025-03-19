// Copyright (c) 2025, OTPL and contributors
// For license information, please see license.txt

frappe.ui.form.on("Naming Series Mapping", {
  select_doctype: function (frm) {
    // Update naming options for the 'department_map' child table
    set_naming_options(frm, "department_map", "select_series");
    // Update naming options for the 'item_group_map' child table
    set_naming_options(frm, "item_group_map", "select_series");
    // Update naming options for the 'customer_group_map' child table
    set_naming_options(frm, "customer_group_map", "select_series");
  },
});

frappe.ui.form.on("Department Map", {
  department_map_add: function (frm, cdt, cdn) {
    let row = frappe.get_doc(cdt, cdn); // Get the new row object
    // Update naming options for the new row in the 'department_map' child table
    set_naming_options(frm, "department_map", "select_series", row);
  },
});

frappe.ui.form.on("Item Group Map", {
  item_group_map_add: function (frm, cdt, cdn) {
    let row = frappe.get_doc(cdt, cdn); // Get the new row object
    // Update naming options for the new row in the 'item_group_map' child table
    set_naming_options(frm, "item_group_map", "select_series", row);
  },
});

frappe.ui.form.on("Customer Group Map", {
  customer_group_map_add: function (frm, cdt, cdn) {
    let row = frappe.get_doc(cdt, cdn);

    set_naming_options(frm, "customer_group_map", "select_series", row);
  },
});

// Function to set naming series options
function set_naming_options(frm, child_table, fieldname, row = null) {
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
        // Dynamically update the options for the specified field in the child table
        frm.fields_dict[child_table].grid.update_docfield_property(
          fieldname, // Fieldname in the child doctype
          "options", // Property to update
          r.message.value.split("\n") // Split the options into an array
        );
        // If a row is passed, set the first option as the default value for the row
        if (row) {
          row[fieldname] = r.message.value.split("\n")[0];
          frm.refresh_field(child_table); // Refresh the child table
        }
      } else {
        frm.fields_dict[child_table].grid.update_docfield_property(
          fieldname, // Fieldname in the child doctype
          "options", // Property to update
          ["No series available"] // Set default option when no series are available
        );
        frm.refresh_field(child_table);
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
