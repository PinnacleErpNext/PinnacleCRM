frappe.ui.form.on("Sales Invoice", {
	refresh: function (frm) {
		if (frm.is_new() && (frm.doc.items[0].delivery_note || frm.doc.items[0].sales_order)) {
            frm.set_df_property("naming_series", "options", ["SINV-API-.FY.-.#.","SINV-MGC-.FY.-.#.","SINV-DSC-.FY.-.#."]);
			// Get fiscal year format
			let today = frappe.datetime.get_today();
			let fiscal_year = today.split("-")[0]; // Get current year
			let start_year = parseInt(fiscal_year.slice(-2)); // Last two digits of the year
			let end_year = start_year + 1; // Next year
			let fy_format = `${start_year}-${end_year}`;

			// Determine naming series based on party_name
			if (frm.doc.items[0].sales_order.includes("API") || frm.doc.items[0].delivery_note.includes("API")) {
				frm.set_value("naming_series", `SINV-API-${fy_format}-.#.`);
			} else if (frm.doc.items[0].sales_order.includes("MGC") || frm.doc.items[0].delivery_note.includes("MGC")) {
				frm.set_value("naming_series", `SINV-MGC-${fy_format}-.#.`);
			} else if (frm.doc.items[0].sales_order.includes("DSC") || frm.doc.items[0].delivery_note.includes("DSC")) {
				frm.set_value("naming_series", `SINV-DSC-${fy_format}-.#.`);
			} else {
				frm.set_value("naming_series", `SINV-${fy_format}-.#.`);
			}

			// Make naming series field read-only
			frm.set_df_property("naming_series", "read_only", true);
		}
	},
});
