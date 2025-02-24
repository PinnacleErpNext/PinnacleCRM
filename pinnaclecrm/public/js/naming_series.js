frappe.provide("pinnaclecrm.utils");

window.seriesToItemGroup = {};
window.departmentToSeries = {};

// Function to apply Naming Series options based on the user's department
pinnaclecrm.utils.applyNamingOptions = function (frm) {
  if (!frm) return;

  let doctype = frm.doctype;

  // Fetch department of the current user
  frappe.call({
    method: "frappe.client.get_value",
    args: {
      doctype: "Employee",
      filters: { user_id: frappe.session.user },
      fieldname: "department",
    },
    callback: function (r) {
      if (!r.message || !r.message.department) {
        frappe.show_alert({
          message: __("No matching Employee record or Department not set."),
          indicator: "red",
        });
        return;
      }

      let userDepartment = r.message.department;

      frappe.db.exists("Naming Series Mapping", doctype).then((exists) => {
        if (!exists) return;

        frappe.db
          .get_doc("Naming Series Mapping", doctype)
          .then((namingSeries) => {
            window.departmentToSeries = {};

            // Populate department-to-series mapping
            namingSeries?.department_map?.forEach(
              ({ department, select_series }) => {
                departmentToSeries[department] =
                  departmentToSeries[department] || [];
                departmentToSeries[department].push(select_series);
              }
            );

            // Apply Naming Series options based on department
            if (departmentToSeries[userDepartment]) {
              frm.set_df_property(
                "naming_series",
                "options",
                departmentToSeries[userDepartment]
              );
              frm.refresh_field("naming_series");
              if (!frm.doc.naming_series) {
                frm.set_value("naming_series", "");
              }
            } else {
              frappe.show_alert({
                message: __(
                  "No naming series found for the user's department."
                ),
                indicator: "red",
              });
            }
          })
          .catch((error) =>
            console.error("Error fetching Naming Series:", error)
          );
      });
    },
  });
};

// Function to apply item group filter based on the selected naming series
pinnaclecrm.utils.applyItemGroupFilter = function (frm) {
  if (!frm) return;

  let doctype = frm.doctype;

  frappe.db.exists("Naming Series Mapping", doctype).then((exists) => {
    if (!exists) return;

    frappe.db
      .get_doc("Naming Series Mapping", doctype)
      .then((namingSeries) => {
        window.seriesToItemGroup = {};

        // Populate series-to-item-group mapping
        namingSeries?.item_group_map?.forEach(
          ({ select_series, item_group }) => {
            seriesToItemGroup[select_series] = item_group;
          }
        );

        let item_grp = seriesToItemGroup[frm.doc.naming_series];

        if (!item_grp) {
          frappe.show_alert(
            {
              message: __(
                "No filter applied as there is no item group associated."
              ),
              indicator: "orange",
            },
            10
          );
          return;
        }

        if (frm.fields_dict["items"]?.grid) {
          frm.fields_dict["items"].grid.get_field("item_code").get_query =
            function (doc, cdt, cdn) {
              return { filters: { item_group: item_grp } };
            };

          frm.refresh_field("items");
        }
      })
      .catch((error) => console.error("Error fetching Naming Series:", error));
  });
};

// Event Listener for page change to apply naming options
$(document).on("page-change", function () {
  if (frappe?.container?.page?.frm) {
    pinnaclecrm.utils.applyNamingOptions(frappe.container.page.frm);
  }
});
