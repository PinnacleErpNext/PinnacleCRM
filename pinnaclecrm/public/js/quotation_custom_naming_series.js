frappe.ui.form.on("Quotation", {
	onload: function (frm) {
		if (frm.is_new()) {
			// Set custom naming series options
			frm.set_df_property("naming_series", "options", [
				"SAL-QTN-API-.FY.-",
				"SAL-QTN-MGC-.FY.-",
				"SAL-QTN-DSC-.FY.-",
				"SAL-QTN-.FY.-",
			]);

			// Get fiscal year format
			let today = frappe.datetime.get_today();
			let fiscal_year = today.split("-")[0]; // Get current year
			let start_year = parseInt(fiscal_year.slice(-2)); // Last two digits of the year
			let end_year = start_year + 1; // Next year
			let fy_format = `${start_year}-${end_year}`;

			// Determine naming series based on party_name
			if (frm.doc.party_name.includes("API")) {
				frm.set_value("naming_series", `SAL-QTN-API-.${fy_format}.-`);
			} else if (frm.doc.party_name.includes("MGC")) {
				frm.set_value("naming_series", `SAL-QTN-MGC-.${fy_format}.-`);
			} else if (frm.doc.party_name.includes("DSC")) {
				frm.set_value("naming_series", `SAL-QTN-DSC-.${fy_format}.-`);
			} else {
				frm.set_value("naming_series", `SAL-QTN-.${fy_format}.-`);
			}

			// Make naming series field read-only
			frm.set_df_property("naming_series", "read_only", true);
		}
	},
});
