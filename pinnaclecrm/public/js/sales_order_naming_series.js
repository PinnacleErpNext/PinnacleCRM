frappe.ui.form.on("Sales Order", {
	onload: function (frm) {
		if (frm.is_new()) {
			// Set custom naming series options
			frm.set_df_property("naming_series", "options", [
				"SAL-ORD-API-.FY.-",
				"SAL-ORD-MGC-.FY.-",
				"SAL-ORD-DSC-.FY.-",
				"SAL-ORD-.FY.-",
			]);
			// Get fiscal year format
			let today = frappe.datetime.get_today();
			let fiscal_year = today.split("-")[0]; // Get current year
			let start_year = parseInt(fiscal_year.slice(-2)); // Last two digits of the year
			let end_year = start_year + 1; // Next year
			let fy_format = `${start_year}-${end_year}`;
			
			// Determine naming series based on party_name
			if (frm.doc.items[0].prevdoc_docname.includes("API")) {
				frm.set_value("naming_series", `SAL-ORD-API-.${fy_format}.-`);
			} else if (frm.doc.items[0].prevdoc_docname.includes("MGC")) {
				frm.set_value("naming_series", `SAL-ORD-MGC-.${fy_format}.-`);
			} else if (frm.doc.items[0].prevdoc_docname.includes("DSC")) {
				frm.set_value("naming_series", `SAL-ORD-DSC-.${fy_format}.-`);
			} else {
				frm.set_value("naming_series", `SAL-ORD-.${fy_format}.-`);
			}

			// Make naming series field read-only
			frm.set_df_property("naming_series", "read_only", true);
		}
	},
});
