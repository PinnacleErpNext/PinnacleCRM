frappe.ui.form.on("Quotation", {
  naming_series: function (frm) {
    let seriesItemGroupMap = {};
    frappe.db
      .get_doc("Item Naming Series Mapping", frm.doc.doctype)
      .then((doc) => {
        doc.item_map.forEach((item) => {
          seriesItemGroupMap[item.select_series] = item.item_group;
        });

        let item_grp = seriesItemGroupMap[frm.doc.naming_series];
        frm.fields_dict["items"].grid.get_field("item_code").get_query =
          function (doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            return {
              filters: {
                item_group: item_grp,
              },
            };
          };

        frm.refresh_field("items");
      })
      .catch((err) => {
        console.error("Error fetching Item Naming Series Mapping:", err);
      });
  },

  refresh: function (frm) {
    console.log("Triggered!");

    // Ensure that 'frm.doc.party_name' is available before proceeding
    if (frm.is_new() && frm.doc.party_name) {
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

              if (frm.doc.party_name.includes("-A") && item.includes("-A-")) {
                console.log(item);
                selected_series = item;
                break; // Exit loop once a match is found
              } else if (
                frm.doc.party_name.includes("-G") &&
                item.includes("-G-")
              ) {
                console.log(item);
                selected_series = item;
                break; // Exit loop once a match is found
              } else if (
                frm.doc.party_name.includes("-D") &&
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
});

// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

cur_frm.cscript.tax_table = "Sales Taxes and Charges";

erpnext.accounts.taxes.setup_tax_validations(
  "Sales Taxes and Charges Template"
);
erpnext.accounts.taxes.setup_tax_filters("Sales Taxes and Charges");
erpnext.pre_sales.set_as_lost("Quotation");
erpnext.sales_common.setup_selling_controller();

frappe.ui.form.on("Quotation", {
  setup: function (frm) {
    (frm.custom_make_buttons = {
      "Sales Order": "Sales Order",
    }),
      frm.set_query("quotation_to", function () {
        return {
          filters: {
            name: ["in", ["Customer", "Lead", "Prospect"]],
          },
        };
      });

    frm.set_df_property("packed_items", "cannot_add_rows", true);
    frm.set_df_property("packed_items", "cannot_delete_rows", true);

    frm.set_query(
      "serial_and_batch_bundle",
      "packed_items",
      (doc, cdt, cdn) => {
        let row = locals[cdt][cdn];
        return {
          filters: {
            item_code: row.item_code,
            voucher_type: doc.doctype,
            voucher_no: ["in", [doc.name, ""]],
            is_cancelled: 0,
          },
        };
      }
    );
  },

  refresh: function (frm) {
    frm.trigger("set_label");
    frm.trigger("set_dynamic_field_label");

    let sbb_field = frm.get_docfield("packed_items", "serial_and_batch_bundle");
    if (sbb_field) {
      sbb_field.get_route_options_for_new_doc = (row) => {
        return {
          item_code: row.doc.item_code,
          warehouse: row.doc.warehouse,
          voucher_type: frm.doc.doctype,
        };
      };
    }
  },

  quotation_to: function (frm) {
    frm.trigger("set_label");
    frm.trigger("toggle_reqd_lead_customer");
    frm.trigger("set_dynamic_field_label");
    // frm.set_value("party_name", ""); // removed to set party_name from url for crm integration
    frm.set_value("customer_name", "");
  },

  set_label: function (frm) {
    frm.fields_dict.customer_address.set_label(
      __(frm.doc.quotation_to + " Address")
    );
  },
});

erpnext.selling.QuotationController = class QuotationController extends (
  erpnext.selling.SellingController
) {
  onload(doc, dt, dn) {
    super.onload(doc, dt, dn);
  }
  party_name() {
    var me = this;
    erpnext.utils.get_party_details(this.frm, null, null, function () {
      me.apply_price_list();
    });

    if (me.frm.doc.quotation_to == "Lead" && me.frm.doc.party_name) {
      me.frm.trigger("get_lead_details");
    }
  }
  refresh(doc, dt, dn) {
    super.refresh(doc, dt, dn);
    frappe.dynamic_link = {
      doc: this.frm.doc,
      fieldname: "party_name",
      doctype: doc.quotation_to,
    };

    var me = this;

    if (doc.__islocal && !doc.valid_till) {
      if (frappe.boot.sysdefaults.quotation_valid_till) {
        this.frm.set_value(
          "valid_till",
          frappe.datetime.add_days(
            doc.transaction_date,
            frappe.boot.sysdefaults.quotation_valid_till
          )
        );
      } else {
        this.frm.set_value(
          "valid_till",
          frappe.datetime.add_months(doc.transaction_date, 1)
        );
      }
    }

    if (doc.docstatus == 1 && !["Lost", "Ordered"].includes(doc.status)) {
      if (
        frappe.boot.sysdefaults
          .allow_sales_order_creation_for_expired_quotation ||
        !doc.valid_till ||
        frappe.datetime.get_diff(doc.valid_till, frappe.datetime.get_today()) >=
          0
      ) {
        this.frm.add_custom_button(
          __("Sales Order"),
          () => this.make_sales_order(),
          __("Create")
        );
      }

      if (doc.status !== "Ordered") {
        this.frm.add_custom_button(__("Set as Lost"), () => {
          this.frm.trigger("set_as_lost_dialog");
        });
      }

      cur_frm.page.set_inner_btn_group_as_primary(__("Create"));
    }

    if (this.frm.doc.docstatus === 0) {
      this.frm.add_custom_button(
        __("Opportunity"),
        function () {
          erpnext.utils.map_current_doc({
            method:
              "erpnext.crm.doctype.opportunity.opportunity.make_quotation",
            source_doctype: "Opportunity",
            target: me.frm,
            setters: [
              {
                label: "Party",
                fieldname: "party_name",
                fieldtype: "Link",
                options: me.frm.doc.quotation_to,
                default: me.frm.doc.party_name || undefined,
              },
              {
                label: "Opportunity Type",
                fieldname: "opportunity_type",
                fieldtype: "Link",
                options: "Opportunity Type",
                default: me.frm.doc.order_type || undefined,
              },
            ],
            get_query_filters: {
              status: ["not in", ["Lost", "Closed"]],
              company: me.frm.doc.company,
            },
          });
        },
        __("Get Items From"),
        "btn-default"
      );
    }

    this.toggle_reqd_lead_customer();
  }

  make_sales_order() {
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
                  default: address_data ? address_data.address_type : "Billing",
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
                  default: address_data ? address_data.is_primary_address : 0,
                },
                {
                  fieldname: "is_shipping_address",
                  label: "Preferred Shipping Address",
                  fieldtype: "Check",
                  default: address_data ? address_data.is_shipping_address : 0,
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
                    frappe.throw("Trigger!");
                    address_dialog.hide();
                    frappe.model.open_mapped_doc({
                      method:
                        "erpnext.selling.doctype.quotation.quotation.make_sales_order",
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
                        if (res.message.status == 200) {
                          address.hide();
                          frappe.model.open_mapped_doc({
                            method:
                              "erpnext.selling.doctype.quotation.quotation.make_sales_order",
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
                      "erpnext.selling.doctype.quotation.quotation.make_sales_order",
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
  }

  set_dynamic_field_label() {
    if (this.frm.doc.quotation_to == "Customer") {
      this.frm.set_df_property("party_name", "label", "Customer");
      this.frm.fields_dict.party_name.get_query = null;
    } else if (this.frm.doc.quotation_to == "Lead") {
      this.frm.set_df_property("party_name", "label", "Lead");
      this.frm.fields_dict.party_name.get_query = function () {
        return { query: "erpnext.controllers.queries.lead_query" };
      };
    } else if (this.frm.doc.quotation_to == "Prospect") {
      this.frm.set_df_property("party_name", "label", "Prospect");
      this.frm.fields_dict.party_name.get_query = null;
    }
  }

  toggle_reqd_lead_customer() {
    var me = this;

    // to overwrite the customer_filter trigger from queries.js
    this.frm.toggle_reqd("party_name", this.frm.doc.quotation_to);
    this.frm.set_query("customer_address", this.address_query);
    this.frm.set_query("shipping_address_name", this.address_query);
  }

  tc_name() {
    this.get_terms();
  }

  address_query(doc) {
    return {
      query: "frappe.contacts.doctype.address.address.address_query",
      filters: {
        link_doctype: frappe.dynamic_link.doctype,
        link_name: doc.party_name,
      },
    };
  }

  validate_company_and_party(party_field) {
    if (!this.frm.doc.quotation_to) {
      frappe.msgprint(
        __("Please select a value for {0} quotation_to {1}", [
          this.frm.doc.doctype,
          this.frm.doc.name,
        ])
      );
      return false;
    } else if (this.frm.doc.quotation_to == "Lead") {
      return true;
    } else {
      return super.validate_company_and_party(party_field);
    }
  }

  get_lead_details() {
    var me = this;
    if (!this.frm.doc.quotation_to === "Lead") {
      return;
    }

    frappe.call({
      method: "erpnext.crm.doctype.lead.lead.get_lead_details",
      args: {
        lead: this.frm.doc.party_name,
        posting_date: this.frm.doc.transaction_date,
        company: this.frm.doc.company,
      },
      callback: function (r) {
        if (r.message) {
          me.frm.updating_party_details = true;
          me.frm.set_value(r.message);
          me.frm.refresh();
          me.frm.updating_party_details = false;
        }
      },
    });
  }

  show_alternative_items_dialog() {
    let me = this;

    const table_fields = [
      {
        fieldtype: "Data",
        fieldname: "name",
        label: __("Name"),
        read_only: 1,
      },
      {
        fieldtype: "Link",
        fieldname: "item_code",
        options: "Item",
        label: __("Item Code"),
        read_only: 1,
        in_list_view: 1,
        columns: 2,
        formatter: (value, df, options, doc) => {
          return doc.is_alternative
            ? `<span class="indicator yellow">${value}</span>`
            : value;
        },
      },
      {
        fieldtype: "Data",
        fieldname: "description",
        label: __("Description"),
        in_list_view: 1,
        read_only: 1,
      },
      {
        fieldtype: "Currency",
        fieldname: "amount",
        label: __("Amount"),
        options: "currency",
        in_list_view: 1,
        read_only: 1,
      },
      {
        fieldtype: "Check",
        fieldname: "is_alternative",
        label: __("Is Alternative"),
        read_only: 1,
      },
    ];

    this.data = this.frm.doc.items
      .filter((item) => item.is_alternative || item.has_alternative_item)
      .map((item) => {
        return {
          name: item.name,
          item_code: item.item_code,
          description: item.description,
          amount: item.amount,
          is_alternative: item.is_alternative,
        };
      });

    const dialog = new frappe.ui.Dialog({
      title: __("Select Alternative Items for Sales Order"),
      fields: [
        {
          fieldname: "info",
          fieldtype: "HTML",
          read_only: 1,
        },
        {
          fieldname: "alternative_items",
          fieldtype: "Table",
          cannot_add_rows: true,
          cannot_delete_rows: true,
          in_place_edit: true,
          reqd: 1,
          data: this.data,
          description: __(
            "Select an item from each set to be used in the Sales Order."
          ),
          get_data: () => {
            return this.data;
          },
          fields: table_fields,
        },
      ],
      primary_action: function () {
        frappe.model.open_mapped_doc({
          method:
            "erpnext.selling.doctype.quotation.quotation.make_sales_order",
          frm: me.frm,
          args: {
            selected_items:
              dialog.fields_dict.alternative_items.grid.get_selected_children(),
          },
        });
        dialog.hide();
      },
      primary_action_label: __("Continue"),
    });

    dialog.fields_dict.info.$wrapper.html(
      `<p class="small text-muted">
				<span class="indicator yellow"></span>
				${__("Alternative Items")}
			</p>`
    );
    dialog.show();
  }
};

cur_frm.script_manager.make(erpnext.selling.QuotationController);

frappe.ui.form.on(
  "Quotation Item",
  "items_on_form_rendered",
  "packed_items_on_form_rendered",
  function (frm, cdt, cdn) {
    // enable tax_amount field if Actual
  }
);

frappe.ui.form.on("Quotation Item", "stock_balance", function (frm, cdt, cdn) {
  var d = frappe.model.get_doc(cdt, cdn);
  frappe.route_options = { item_code: d.item_code };
  frappe.set_route("query-report", "Stock Balance");
});
