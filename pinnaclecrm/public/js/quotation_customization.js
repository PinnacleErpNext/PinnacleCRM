frappe.ui.form.on("Quotation", {
  // naming_series: function (frm) {
  //   let seriesItemGroupMap = {};
  //   frappe.db
  //     .get_doc("Naming Series Mapping", frm.doc.doctype)
  //     .then((doc) => {
  //       doc.item_group_map.forEach((item) => {
  //         seriesItemGroupMap[item.select_series] = item.item_group;
  //       });
  //       console.log(seriesItemGroupMap)
  //       let item_grp = seriesItemGroupMap[frm.doc.naming_series];
  //       console.log("igrp:-",item_grp)
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
  //     })
  //     .catch((err) => {
  //       console.error("Error fetching Item Naming Series Mapping:", err);
  //     });
  // },
  refresh: function (frm) {
    // Ensure that 'frm.doc.party_name' is available before proceeding
    if (frm.is_new() && frm.doc.party_name) {
      let naming_series;
      frappe.db
        .get_value("Lead", frm.doc.party_name, "naming_series")
        .then((r) => {
          naming_series = r.message.naming_series;
        });
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
            console.log(selected_series);
            // Set the selected series as the naming series, or use the default
            frm.set_value(
              "naming_series",
              selected_series || frm.doc.naming_series
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
            frappe.call({
              method: "pinnaclecrm.api.get_address",
              args: {
                docname: this.frm.docname,
              },
              callback: function (res) {
                console.log(res.message);
                let address_data =
                  res.message && res.message.length > 0 ? res.message[0] : null;

                setTimeout(() => {
                  // Ensures all fields are properly loaded before rendering
                  let address_dialog = new frappe.ui.Dialog({
                    title: "Address Details",
                    fields: [
                      {
                        fieldname: "address_details",
                        fieldtype: "Section Break",
                        options: "fa fa-map-marker",
                      },
                      {
                        fieldname: "gst_category",
                        label: "GST Category",
                        fieldtype: "Select",
                        options: [
                          "Registered Regular",
                          "Registered Composition",
                          "Unregistered",
                          "SEZ",
                          "Overseas",
                          "Deemed Export",
                          "UIN",
                          "Tax Deducter",
                          "Tax Collecter",
                          "Input Service Distributer",
                        ].join("\n"),
                        default: address_data
                          ? address_data.gst_category
                          : "Unregistered",
                      },
                      {
                        fieldname: "gstin",
                        label: "GSTIN",
                        fieldtype: "Data",
                        default: address_data ? address_data.gstin : "",
                        mandatory_depends_on:
                          "eval:doc.gst_category != 'Unregistered'",
                      },
                      {
                        fieldname: "address_title",
                        label: "Address Title",
                        fieldtype: "Data",
                        default: address_data ? address_data.address_title : "",
                      },
                      {
                        fieldname: "address_type",
                        label: "Address Type",
                        fieldtype: "Select",
                        options: [
                          "Billing",
                          "Shipping",
                          "Office",
                          "Personal",
                          "Plant",
                          "Postal",
                          "Shop",
                          "Subsidiary",
                          "Warehouse",
                          "Current",
                          "Permanent",
                          "Other",
                        ].join("\n"),
                        reqd: 1,
                        default: address_data
                          ? address_data.address_type
                          : "Billing",
                      },
                      {
                        fieldname: "address_line1",
                        label: "Address Line 1",
                        fieldtype: "Data",
                        reqd: 1,
                        default: address_data ? address_data.address_line1 : "",
                      },
                      {
                        fieldname: "address_line2",
                        label: "Address Line 2",
                        fieldtype: "Data",
                        default: address_data ? address_data.address_line2 : "",
                      },
                      {
                        fieldname: "city",
                        label: "City/Town",
                        fieldtype: "Data",
                        reqd: 1,
                        default: address_data ? address_data.city : "",
                      },
                      {
                        fieldname: "county",
                        label: "County",
                        fieldtype: "Data",
                        default: address_data ? address_data.county : "",
                      },
                      {
                        fieldname: "state",
                        label: "State/Province",
                        fieldtype: "Select",
                        options: [
                          "Andhra Pradesh",
                          "Arunachal Pradesh",
                          "Assam",
                          "Bihar",
                          "Chhattisgarh",
                          "Goa",
                          "Gujarat",
                          "Haryana",
                          "Himachal Pradesh",
                          "Jharkhand",
                          "Karnataka",
                          "Kerala",
                          "Madhya Pradesh",
                          "Maharashtra",
                          "Manipur",
                          "Meghalaya",
                          "Mizoram",
                          "Nagaland",
                          "Odisha",
                          "Punjab",
                          "Rajasthan",
                          "Sikkim",
                          "Tamil Nadu",
                          "Telangana",
                          "Tripura",
                          "Uttar Pradesh",
                          "Uttarakhand",
                          "West Bengal",
                          "Andaman & Nicobar Islands",
                          "Chandigarh",
                          "Dadra & Nagar Haveli and Daman & Diu",
                          "Lakshadweep",
                          "Ladakh",
                          "Puducherry",
                          "Jammu and Kashmir",
                        ].join("\n"),
                        reqd: 1,
                        default: address_data ? address_data.state : "",
                      },
                      {
                        fieldname: "country",
                        label: "Country",
                        fieldtype: "Link",
                        options: "Country",
                        reqd: 1,
                        default: address_data ? address_data.country : "",
                      },
                      {
                        fieldname: "pincode",
                        label: "Postal Code",
                        fieldtype: "Data",
                        default: address_data ? address_data.pincode : "",
                      },

                      {
                        fieldname: "column_break0",
                        fieldtype: "Column Break",
                        width: "50%",
                      },

                      {
                        fieldname: "email_id",
                        label: "Email Address",
                        fieldtype: "Data",
                        options: "Email",
                        default: address_data ? address_data.email_id : "",
                      },
                      {
                        fieldname: "phone",
                        label: "Phone",
                        fieldtype: "Data",
                        default: address_data ? address_data.phone : "",
                      },
                      {
                        fieldname: "fax",
                        label: "Fax",
                        fieldtype: "Data",
                        default: address_data ? address_data.fax : "",
                      },
                      {
                        fieldname: "is_primary_address",
                        label: "Preferred Billing Address",
                        fieldtype: "Check",
                        default: address_data
                          ? address_data.is_primary_address
                          : 0,
                      },
                      {
                        fieldname: "is_shipping_address",
                        label: "Preferred Shipping Address",
                        fieldtype: "Check",
                        default: address_data
                          ? address_data.is_shipping_address
                          : 0,
                      },
                      {
                        fieldname: "disabled",
                        label: "Disabled",
                        fieldtype: "Check",
                        default: address_data ? address_data.disabled : 0,
                      },
                    ],
                    size: "small",
                    primary_action_label: address_data
                      ? "Proceed"
                      : "Create Sales Order",
                    primary_action(values) {
                      if (!values) {
                        frappe.msgprint(__("Please fill all required fields."));
                        return;
                      }

                      let is_changed =
                        !address_data ||
                        Object.keys(values).some(
                          (key) => values[key] !== address_data[key]
                        );

                      if (is_changed) {
                        if (address_dialog.primary_action_label === "Proceed") {
                          // frappe.throw("Trigger!");
                          address_dialog.hide();
                          frappe.model.open_mapped_doc({
                            method:
                              "pinnaclecrm.events.make_sales_order.make_sales_order",
                            frm: cur_frm,
                          });
                        } else {
                          frappe.call({
                            method: "pinnaclecrm.api.create_customer",
                            args: {
                              address: values,
                              src: cur_frm.doc.name,
                            },
                            callback: (res) => {
                              debugger;
                              if (res.message.status == 200) {
                                debugger;
                                address_dialog.hide();
                                frappe.model.open_mapped_doc({
                                  method:
                                    "pinnaclecrm.events.make_sales_order.make_sales_order",
                                  frm: me.frm,
                                });
                              }
                            },
                          });
                        }
                      } else {
                        address_dialog.hide();
                        frappe.model.open_mapped_doc({
                          method:
                            "pinnaclecrm.events.make_sales_order.make_sales_order",
                          frm: cur_frm,
                        });
                      }
                    },
                  });

                  address_dialog.show();
                }, 100); // Delay to ensure form fields load properly
              },
              error: function (err) {
                console.error("Error while fetching address:", err);
              },
            });
          }
        };
    }
  },
});
