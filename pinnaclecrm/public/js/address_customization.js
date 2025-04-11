frappe.ui.form.on("Address", {
  refresh: function (frm) {
    frm.add_custom_button("Get GST IN Details", () => {
      fetchGstinDetails(frm);
    });
  },
  address_line1: function (frm) {
    frm.set_value("address_line1", frm.doc.address_line1.toUpperCase());
  },
  address_line2: function (frm) {
    frm.set_value("address_line2", frm.doc.address_line2.toUpperCase());
  },
  city: function (frm) {
    frm.set_value("city", frm.doc.city.toUpperCase());
  },
});

function fetchGstinDetails(frm) {
  const gstDailog = new frappe.ui.Dialog({
    title: "Get GST IN Details",
    fields: [
      {
        label: "GST IN",
        fieldname: "gstin",
        fieldtype: "Data",
        reqd: 1,
      },
      {
        label: "Fetch GST Details",
        fieldname: "fetch_button",
        fieldtype: "Button",
      },
      {
        label: "Select Customer Name",
        fieldname: "customer_name_option",
        fieldtype: "Select",
        options: [],
        hidden: 1,
        onchange: function () {
          let selected = this.value;
          let field = gstDailog.get_field("customer_name_option");
          let display_name = "";

          if (selected.includes("Trade Name")) {
            display_name = field.tradeNam;
          } else if (selected.includes("Legal Name")) {
            display_name = field.lgnm;
          }

          // Store selected name
          gstDailog.selectedCustomerName = display_name;
          gstDailog.address.cnm = display_name;

          // Update GST HTML preview immediately
          gstDailog.fields_dict.gst_html.$wrapper.html(`
            <p><strong>GSTIN:</strong> ${gstDailog.address.gstin}</p>
            <p><strong>Customer Name:</strong> ${gstDailog.address.cnm}</p>
            <p><strong>Address Line 1:</strong> ${
              gstDailog.address.al1 || ""
            }</p>
            <p><strong>Address Line 2:</strong> ${
              gstDailog.address.al2 || ""
            }</p>
            <p><strong>City:</strong> ${gstDailog.address.cty || ""}</p>
            <p><strong>State:</strong> ${gstDailog.address.stcd || ""}</p>
            <p><strong>Postal Code:</strong> ${gstDailog.address.pncd || ""}</p>
          `);
        },
      },

      {
        label: "GST Details",
        fieldname: "gst_html",
        fieldtype: "HTML",
        options: "",
      },
    ],
    primary_action_label: "Use This Address",
    primary_action(values) {
      // Make sure GST data and address information are available.
      if (!gstDailog.gstData || !gstDailog.address) {
        frappe.msgprint("Please fetch GSTIN details first.");
        return;
      }
      const address = gstDailog.address;

      // Use the selectedCustomerName if available; otherwise, default to what was already stored in address.cnm.
      const customer_name = gstDailog.selectedCustomerName || address.cnm || "";

      // Populate the form fields with the retrieved address details.
      frm.set_value("address_line1", (address.al1 || "").toUpperCase());
      frm.set_value("address_line2", (address.al2 || "").toUpperCase());
      frm.set_value("city", (address.cty || "").toUpperCase());
      frm.set_value("state", address.stcd || "");
      frm.set_value("pincode", address.pncd || "");
      frm.set_value("gstin", address.gstin || "");
      frm.set_value("address_title", customer_name.toUpperCase());
      gstDailog.hide();
    },
  });

  // Click event handler for the Fetch Button
  gstDailog.fields_dict.fetch_button.input.onclick = function () {
    const gstin = gstDailog.get_value("gstin");
    if (!gstin || gstin.length !== 15) {
      frappe.msgprint({
        title: "Invalid GSTIN",
        message: "GSTIN must be exactly 15 characters.",
        indicator: "red",
      });
      return;
    }
    // Show animated loader in the GST Details (HTML) field.
    gstDailog.fields_dict.gst_html.$wrapper.html(`
      <style>
        .loader {
          border: 8px solid #f3f3f3;
          border-top: 8px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div class="loader"></div>
    `);

    frappe.call({
      method: "pinnaclecrm.api.get_gstin_details",
      args: { gst_in: gstin },
      callback(res) {
        if (
          res.message &&
          res.message.status_cd === "1" &&
          res.message.data?.pradr?.addr
        ) {
          const gstData = res.message.data;
          const addr = gstData.pradr.addr;
          let tradeNam = gstData.tradeNam;
          let lgnm = gstData.lgnm;

          // Update the select field options with the trade and legal names.
          let select_field = gstDailog.get_field("customer_name_option");
          select_field.df.options = [
            `Trade Name: ${tradeNam}`,
            `Legal Name: ${lgnm}`,
          ];
          select_field.df.hidden = 0;
          gstDailog.refresh();

          // Store the customer names on the select field for later access.
          select_field.tradeNam = tradeNam;
          select_field.lgnm = lgnm;

          // Store GST API data for later use.
          gstDailog.gstData = gstData;

          // Set the default customer name if user hasn't made a selection yet.
          if (!gstDailog.selectedCustomerName) {
            gstDailog.selectedCustomerName = tradeNam;
          }

          // Construct the address object using consistent keys.
          gstDailog.address = {
            gstin: gstData.gstin,
            // Default customer name based on available data; this will get overwritten on selection.
            cnm: gstDailog.selectedCustomerName,
            al1: addr.bno,
            al2: addr.st,
            cty: addr.dst,
            stcd: addr.stcd,
            pncd: addr.pncd,
          };

          // Replace the loader with the fetched GST details.
          gstDailog.fields_dict.gst_html.$wrapper.html(`
            <p><strong>GSTIN:</strong> ${gstDailog.address.gstin}</p>
            <p><strong>Customer Name:</strong> ${
              gstDailog.selectedCustomerName
            }</p>
            <p><strong>Address Line 1:</strong> ${
              gstDailog.address.al1 || ""
            }</p>
            <p><strong>Address Line 2:</strong> ${
              gstDailog.address.al2 || ""
            }</p>
            <p><strong>City:</strong> ${gstDailog.address.cty || ""}</p>
            <p><strong>State:</strong> ${gstDailog.address.stcd || ""}</p>
            <p><strong>Postal Code:</strong> ${gstDailog.address.pncd || ""}</p>
          `);
        } else {
          gstDailog.fields_dict.gst_html.$wrapper.html("");
          frappe.msgprint("Invalid or incomplete GSTIN data.");
        }
      },
      error(err) {
        console.error(err);
        frappe.msgprint("Error fetching GSTIN details.");
      },
    });
  };

  gstDailog.show();
}
