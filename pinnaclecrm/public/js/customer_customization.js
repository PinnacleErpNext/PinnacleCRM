frappe.ui.form.on("Customer", {
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
