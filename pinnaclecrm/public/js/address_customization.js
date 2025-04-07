frappe.ui.form.on("Address", {
  custom_fetch_gst_details: function (frm) {
    fetchGstinDetails(frm);
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
  let gstIn = frm.doc.gstin;

  if (!gstIn || gstIn.length !== 15) {
    frappe.msgprint({
      title: __("Invalid GSTIN"),
      message: __("GSTIN must be exactly 15 characters long."),
      indicator: "red",
    });
    return;
  }

  frappe.call({
    method: "pinnaclecrm.api.get_gstin_details",
    args: { gst_in: gstIn },
    callback: function (res) {
      console.log("GST API Response:", res);

      if (
        res.message &&
        res.message.status_cd === "1" &&
        res.message.data?.pradr?.addr
      ) {
        let gstData = res.message.data;
        let addr = gstData.pradr.addr;
        frappe.prompt(
          [
            {
              label: "Gst IN",
              fieldname: "gst_in",
              fieldtype: "Data",
              default: gstData.gstin,
              read_only: true,
            },
            {
              label: "Address Line 1",
              fieldname: "address_line1",
              fieldtype: "Data",
              default: addr.bno,
              read_only: true,
            },
            {
              label: "Address Line 2",
              fieldname: "address_line2",
              fieldtype: "Data",
              default: gstData.pradr.addr.st,
              read_only: true,
            },
            {
              label: "City",
              fieldname: "city",
              fieldtype: "Data",
              default: addr.dst,
              read_only: true,
            },
            {
              label: "State",
              fieldname: "state",
              fieldtype: "Data",
              default: addr.stcd,
              read_only: true,
            },
            {
              label: "Postal Code",
              fieldname: "pincode",
              fieldtype: "Data",
              default: addr.pncd,
              read_only: true,
            },
          ],
          (values) => {
            frm.set_value("address_line1", addr.bno.toUpperCase() || "");
            frm.set_value("address_line2", addr.st.toUpperCase() || "");
            frm.set_value("city", addr.dst.toUpperCase() || "");
            frm.set_value("state", addr.stcd || "");
            frm.set_value("pincode", addr.pncd || "");
            frm.set_value(
              "address_title",
              (gstData.tradeNam || "").toUpperCase()
            );
          },
          __("GST Address Details"),
          __("Use This Address")
        );
      } else {
        frappe.msgprint({
          title: __("Invalid GSTIN"),
          message: __(
            "Invalid GSTIN details received or missing address data."
          ),
          indicator: "red",
        });
      }
    },
    error: function (err) {
      console.error("Error fetching GSTIN details:", err);
      frappe.msgprint({
        title: __("API Error"),
        message: __("Could not fetch GSTIN details. Please try again."),
        indicator: "red",
      });
    },
  });
}
