frappe.ui.form.on("Address", {
  refresh: function (frm) {
    if (frm.is_new() && frm.doc.gstin) {
      fetchGstinDetails(frm);
    }
  },
  gstin: function (frm) {
    fetchGstinDetails(frm);
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

        console.log("Extracted Address:", gstData);

        frm.set_value("address_line1", addr.bno || "");
        frm.set_value("address_line2", addr.st || "");
        frm.set_value("city", addr.dst || "");
        frm.set_value("state", addr.stcd || "");
        frm.set_value("pincode", addr.pncd || "");
        frm.set_value("address_title", (gstData.tradeNam || "").toUpperCase());
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
