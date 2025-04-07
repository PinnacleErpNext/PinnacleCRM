frappe.ui.form.on("Customer", {
  refresh: function (frm) {
    if (frm.is_new()) {
      // Add a custom button to the form
      frm.add_custom_button("Get Customer Name", () => {
        // Initialize the dialog with all necessary fields
        let gst_dialog = new frappe.ui.Dialog({
          title: "Enter GST Details",
          fields: [
            {
              label: "GST IN",
              fieldname: "gstin",
              fieldtype: "Data",
              reqd: 1,
              onchange: function () {
                // Show the fetch button only when GSTIN is exactly 15 characters
                let fetch_btn = gst_dialog.get_field("fetch_customer_name");
                if (this.value && this.value.length === 15) {
                  fetch_btn.df.hidden = 0;
                } else {
                  fetch_btn.df.hidden = 1;
                }
                gst_dialog.refresh();
              },
            },
            {
              label: "Fetch Customer Name",
              fieldname: "fetch_customer_name",
              fieldtype: "Button",
              hidden: 1,
              click: function () {
                let gstin = gst_dialog.get_value("gstin");
                if (gstin && gstin.length === 15) {
                  frappe.call({
                    method: "pinnaclecrm.api.get_gstin_details",
                    args: { gst_in: gstin },
                    callback: function (res) {
                      if (res && res.message && res.message.data) {
                        let tradeNam = res.message.data.tradeNam;
                        let lgnm = res.message.data.lgnm;

                        let select_field = gst_dialog.get_field(
                          "customer_name_option"
                        );
                        select_field.df.options = [
                          `Trade Name: ${tradeNam}`,
                          `Legal Name: ${lgnm}`,
                        ];
                        select_field.df.hidden = 0;

                        let use_btn = gst_dialog.get_field("use_this_name");
                        use_btn.df.hidden = 0;

                        // Store mapping for later use
                        select_field.tradeNam = tradeNam;
                        select_field.lgnm = lgnm;

                        gst_dialog.refresh();
                      } else {
                        frappe.msgprint("Failed to fetch GST details.");
                      }
                    },
                    error: function () {
                      frappe.msgprint("Error fetching GST details.");
                    },
                  });
                } else {
                  frappe.msgprint("Please enter a valid 15-character GSTIN.");
                }
              },
            },
            {
              label: "Customer Name Option",
              fieldname: "customer_name_option",
              fieldtype: "Select",
              options: [],
              hidden: 1,
            },
            {
              label: "Use This Name",
              fieldname: "use_this_name",
              fieldtype: "Button",
              hidden: 1,
              click: function () {
                let selected = gst_dialog.get_value("customer_name_option");
                let name = "";

                let select_field = gst_dialog.get_field("customer_name_option");
                if (selected.includes("Trade Name")) {
                  name = select_field.tradeNam;
                } else if (selected.includes("Legal Name")) {
                  name = select_field.lgnm;
                }

                if (name) {
                  cur_frm.set_value("customer_name", name);
                  frappe.msgprint(`Customer name set to: ${name}`);
                  gst_dialog.hide();
                } else {
                  frappe.msgprint("Please select a valid name option.");
                }
              },
            },
          ],
          primary_action_label: "Close",
          primary_action: function () {
            gst_dialog.hide();
          },
        });

        // Display the dialog
        gst_dialog.show();
      });
    }
  },
  customer_name: function (frm) {
    customerName = frm.doc.customer_name;
    frm.set_value("customer_name", customerName.toUpperCase());
  },

  gstin: function (frm) {
    let gstin = frm.doc.gstin;
    if (gstin.length !== 15) {
      console.error("Invalid GSTIN length");
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      frappe.call({
        method: "pinnaclecrm.api.get_gstin_details",
        args: { gst_in: gstin },
        callback: (res) => {
          if (res.message && res.message.status_cd === "1") {
            let customerName = res.message.data.lgnm;
            frm
              .set_value("customer_name", customerName)
              .then(() => resolve(customerName))
              .catch(reject);
          } else {
            reject(new Error("Invalid GSTIN details received"));
          }
        },
        error: (err) => reject(err),
      });
    });
  },
});
