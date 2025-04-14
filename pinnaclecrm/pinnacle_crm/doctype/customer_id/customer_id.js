// Copyright (c) 2025, OTPL and contributors
// For license information, please see license.txt

frappe.ui.form.on("Customer ID", {
  refresh(frm) {},
  customer: function (frm) {
    frappe.db.get_doc("Customer", frm.doc.customer).then((doc) => {
      frm.set_value("customer_name", doc.customer_name);
    });
  },
});
