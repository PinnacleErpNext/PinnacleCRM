frappe.ui.form.on("Delivery Note", {
	refresh: function (frm) {
		if (frm.is_new()) {
            frm.set_df_property("naming_series", "options", ["DN-API-.FY.-.#.","DN-MGC-.FY.-.#.","DN-DSC-.FY.-.#."]);
			// Get fiscal year format
			let today = frappe.datetime.get_today();
			let fiscal_year = today.split("-")[0]; // Get current year
			let start_year = parseInt(fiscal_year.slice(-2)); // Last two digits of the year
			let end_year = start_year + 1; // Next year
			let fy_format = `${start_year}-${end_year}`;

			// Determine naming series based on party_name
			if (frm.doc.items[0].against_sales_order.includes("API")) {
				frm.set_value("naming_series", `DN-API-${fy_format}-.#.`);
			} else if (frm.doc.items[0].against_sales_order.includes("MGC")) {
				frm.set_value("naming_series", `DN-MGC-${fy_format}-.#.`);
			} else if (frm.doc.items[0].against_sales_order.includes("DSC")) {
				frm.set_value("naming_series", `DN-DSC-${fy_format}-.#.`);
			} else {
				frm.set_value("naming_series", `DN-${fy_format}-.#.`);
			}

			// Make naming series field read-only
			frm.set_df_property("naming_series", "read_only", true);
		}
	},
});
