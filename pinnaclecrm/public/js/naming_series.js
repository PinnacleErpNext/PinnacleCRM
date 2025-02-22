$(document).on("page-change", function () {
  if (
    frappe &&
    frappe.container &&
    frappe.container.page &&
    frappe.container.page.frm
  ) {
    let frm = frappe.container.page.frm;
    let doctype = frm.doctype;
    const departmentToSeries = {};
    const seriesToItemGroup = {};

    // Fetch the department of the current user
    frappe.call({
      method: "frappe.client.get_value",
      args: {
        doctype: "Employee",
        filters: { user_id: frappe.session.user },
        fieldname: "department",
      },
      callback: function (r) {
        if (r.message) {
          let userDepartment = r.message.department;
          if (userDepartment) {
            frappe.db
              .exists("Naming Series Mapping", doctype)
              .then((exists) => {
                if (exists) {
                  frappe.db
                    .get_doc("Naming Series Mapping", doctype)
                    .then((namingSeries) => {
                      namingSeries.department_map.forEach((entry) => {
                        const { department, select_series } = entry;

                        if (departmentToSeries[department]) {
                          // If the department already exists, add the new series to the array
                          departmentToSeries[department].push(select_series);
                        } else {
                          // If the department doesn't exist, create a new array with the series
                          departmentToSeries[department] = [select_series];
                        }
                      });

                      namingSeries.item_group_map.forEach((entry) => {
                        const { select_series, item_group } = entry;

                        seriesToItemGroup[select_series] = item_group;
                      });
                      if (departmentToSeries[userDepartment]) {
                        let options = departmentToSeries[userDepartment];

                        frm.set_df_property(
                          "naming_series",
                          "options",
                          options
                        );
                        frm.refresh_field("naming_series");
                        if (!frm.doc.naming_series) {
                          frm.set_value("naming_series", "");
                        }
                      } else {
                        frappe.show_alert(
                          {
                            message: __(
                              "No naming series found for the user's department."
                            ),
                            indicator: "red",
                          },
                          10
                        );
                      }
                    })
                    .catch((error) => {
                      console.log("Error fetching Naming Series:", error);
                    });
                }
              });
          } else {
            frappe.show_alert(
              {
                message: __("Department field is empty for the current user."),
                indicator: "red",
              },
              10
            );
          }
        } else {
          frappe.show_alert(
            {
              message: __("No matching Employee record found."),
              indicator: "red",
            },
            10
          );
        }
      },
    });

    // Apply item group filter
    // frappe.ui.form.on(doctype, {
    //   refresh: function (frm) {
    //     console.log(seriesToItemGroup);
    //     let item_grp = seriesToItemGroup[frm.doc.naming_series];
    //     if (!item_grp) {
    //       frappe.show_alert(
    //         {
    //           message: __(
    //             "No filter applied as there is no item group associated."
    //           ),
    //           indicator: "orange",
    //         },
    //         10
    //       );
    //     }
    //     let is_item = frm.fields_dict["items"]

    //     if (is_item) {
    //       frm.fields_dict["items"].grid.get_field("item_code").get_query =
    //         function (doc, cdt, cdn) {
    //           let row = locals[cdt][cdn];
    //           return {
    //             filters: {
    //               item_group: item_grp,
    //             },
    //           };
    //         };

    //       frm.refresh_field("items");
    //     }
    //   },
    // });

    frappe.provide("pinnaclecrm.utils");

    pinnaclecrm.utils.applyItemGroupFilter = function (frm) {
      console.log(seriesToItemGroup);

      let item_grp = seriesToItemGroup[frm.doc.naming_series];
      console.log(`igrp:${item_grp}`)
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
        return; // Exit if no item group is associated
      }

      if (frm.fields_dict["items"] && frm.fields_dict["items"].grid) {
        frm.fields_dict["items"].grid.get_field("item_code").get_query =
          function (doc, cdt, cdn) {
            return {
              filters: {
                item_group: item_grp,
              },
            };
          };

        frm.refresh_field("items");
      }
    };
  }
});
