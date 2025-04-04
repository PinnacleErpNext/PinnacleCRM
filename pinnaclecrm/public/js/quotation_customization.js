frappe.ui.form.on("Quotation", {
  naming_series: function (frm) {
    pinnaclecrm.utils.applyItemGroupFilter(frm);
  },
  quotation_to: function (frm) {
    if (frm.doc.quotation_to === "Customer") {
      pinnaclecrm.utils.applyCustomerGroupFilter(frm, "party_name");
    }
  },
  refresh: function (frm) {
    if (frm.is_new()) {
      frm.set_value("naming_series", "");
    }
    // Ensure that 'frm.doc.party_name' is available before proceeding
    if (frm.is_new() && frm.doc.party_name) {
      let naming_series;
      frappe.db
        .get_value("Lead", frm.doc.party_name, "naming_series")
        .then((r) => {
          naming_series = r.message.naming_series;
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
                if (!selected_series) {
                  frappe.show_alert({
                    message: __("Series Migration Failed!"),
                    indicator: "red",
                  });
                }
                // Set the selected series as the naming series, or use the default
                frm.set_value("naming_series", selected_series);

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
                let addressData =
                  res.message && res.message.length > 0 ? res.message[0] : null;
                openAddressDialog(addressData);
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

function getGstInDetails(gstIn) {
  if (gstIn.length !== 15) {
    console.error("Invalid GSTIN length");
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    frappe.call({
      method: "pinnaclecrm.api.get_gstin_details",
      args: { gst_in: gstIn },
      callback: (res) => {
        if (res.message && res.message.status_cd === "1") {
          resolve(res.message.data);
        } else {
          reject(new Error("Invalid GSTIN details received"));
        }
      },
      error: (err) => reject(err),
    });
  });
}

function openAddressDialog(addressData) {
  // Clone the original data to compare against future changes.
  let originalValues = addressData ? { ...addressData } : {};
  let gstData;
  // Create the Address Dialog
  let address_dialog = new frappe.ui.Dialog({
    title: "Address Details",
    fields: [
      {
        fieldname: "address_details",
        fieldtype: "Section Break",
        options: "fa fa-map-marker",
      },
      {
        fieldname: "gstin",
        label: "GSTIN",
        fieldtype: "Data",
        default: addressData ? addressData.gstin : "",
        onchange: async function () {
          // Detect change for this field
          handleFieldChange(this.df.fieldname, this.get_value());

          let gstinValue = this.get_value();
          if (gstinValue.length === 15) {
            gstData = await getGstInDetails(gstinValue);
            if (gstData && gstData.pradr && gstData.pradr.addr) {
              let addr = gstData.pradr.addr;
              let fields_dict = address_dialog.fields_dict;
              fields_dict["address_line1"].set_value(addr.bno || "");
              fields_dict["address_line2"].set_value(addr.st || "");
              fields_dict["city"].set_value(addr.dst || "");
              fields_dict["state"].set_value(addr.stcd || "");
              fields_dict["pincode"].set_value(addr.pncd || "");
              fields_dict["address_title"].set_value(
                (gstData.tradeNam || "").toUpperCase()
              );
            } else {
              frappe.msgprint(__("Invalid GSTIN data received."));
            }
          }
        },
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
        default: addressData ? addressData.gst_category : "Unregistered",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "address_title",
        label: "Address Title",
        fieldtype: "Data",
        default: addressData ? addressData.address_title : "",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
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
        default: addressData ? addressData.address_type : "Billing",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "address_line1",
        label: "Address Line 1",
        fieldtype: "Data",
        reqd: 1,
        default: addressData ? addressData.address_line1 : "",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "address_line2",
        label: "Address Line 2",
        fieldtype: "Data",
        default: addressData ? addressData.address_line2 : "",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "city",
        label: "City/Town",
        fieldtype: "Data",
        reqd: 1,
        default: addressData ? addressData.city : "",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "county",
        label: "County",
        fieldtype: "Data",
        default: addressData ? addressData.county : "",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
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
        default: addressData ? addressData.state : "",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "country",
        label: "Country",
        fieldtype: "Link",
        options: "Country",
        reqd: 1,
        default: addressData ? addressData.country : "India",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "pincode",
        label: "Postal Code",
        fieldtype: "Data",
        default: addressData ? addressData.pincode : "",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
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
        default: addressData ? addressData.email_id : "",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "phone",
        label: "Phone",
        fieldtype: "Data",
        default: addressData ? addressData.phone : "",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "fax",
        label: "Fax",
        fieldtype: "Data",
        default: addressData ? addressData.fax : "",
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "is_primary_address",
        label: "Preferred Billing Address",
        fieldtype: "Check",
        default: addressData ? addressData.is_primary_address : 0,
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      {
        fieldname: "is_shipping_address",
        label: "Preferred Shipping Address",
        fieldtype: "Check",
        default: addressData ? addressData.is_shipping_address : 0,
        onchange: function () {
          handleFieldChange(this.df.fieldname, this.get_value());
        },
      },
      // Uncomment the block below if you want to include a "disabled" field.
      // {
      //   fieldname: "disabled",
      //   label: "Disabled",
      //   fieldtype: "Check",
      //   default: addressData ? addressData.disabled : 0,
      //   onchange: function () {
      //     handleFieldChange(this.df.fieldname, this.get_value());
      //   },
      // },
    ],
    size: "small",
    primary_action_label: "Proceed",
    primary_action(values) {
      // Check the current label to decide on the process.
      if (
        address_dialog.primary_action_label === "Update address and Proceed" ||
        address_dialog.primary_action_label === "Create address and Proceed"
      ) {
        // Save process: call API to update/create customer details.
        frappe.call({
          method: "pinnaclecrm.api.create_and_update_address",
          args: {
            address: values,
            src: cur_frm.doc.name,
            addr_name: addressData?.name,
          },
          callback: (res) => {
            if (res.message.status === 200) {
              address_dialog.hide();
              frappe.model.open_mapped_doc({
                method: "pinnaclecrm.events.make_sales_order.make_sales_order",
                frm: cur_frm,
              });
            }
          },
        });
      } else {
        // Proceed process: simply open the mapped document.
        address_dialog.hide();
        frappe.model.open_mapped_doc({
          method: "pinnaclecrm.events.make_sales_order.make_sales_order",
          frm: cur_frm,
        });
      }
    },
  });

  // This function is called whenever a field value changes.
  // It compares current values with the original values and updates the button label.
  function handleFieldChange(fieldname, newValue) {
    let anyChange = false;
    let currentValues = address_dialog.get_values() || {};
    Object.keys(currentValues).forEach((key) => {
      let origVal = originalValues[key] || "";
      let currentVal = currentValues[key] || "";
      if (origVal !== currentVal) {
        anyChange = true;
      }
    });
    let newLabel = anyChange ? "Update address and Proceed" : "Proceed";
    // Update the label on the primary action button using jQuery.
    if (gstData) {
      newLabel = "Create address and Proceed";
    }
    address_dialog.primary_action_label = newLabel;
    address_dialog.$wrapper.find(".modal-footer .btn-primary").text(newLabel);
  }

  address_dialog.show();
}
