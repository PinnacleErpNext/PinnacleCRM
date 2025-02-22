frappe.listview_settings["Sales Order"] = {
  onload: function (listview) {
    // Check if the current user matches the specific user
    if (frappe.session.user_email === "admin@example.com") {
      frappe.route_options = {
        docstatus: 0,
        custom_payment_mode: ["in", ["Credit", "Others"]],
      };
    }
  },
};

frappe.ui.form.on("Sales Order", {
  refresh: function (frm) {
    console.log("Triggered!");
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
  onload: function (frm) {
    setTimeout(function () {
      frm.page.remove_inner_button("Pick List", "Create");
      frm.page.remove_inner_button("Work Order", "Create");
      frm.page.remove_inner_button("Material Request", "Create");
      frm.page.remove_inner_button("Request For Raw Materials", "Create");
      frm.page.remove_inner_button("Purchase Order", "Create");
      frm.page.remove_inner_button("Project", "Create");
      frm.page.remove_inner_button("Payment Request", "Create");
    }, 100);
  },
});
