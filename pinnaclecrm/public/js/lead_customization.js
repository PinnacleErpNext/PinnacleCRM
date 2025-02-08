frappe.ui.form.on("Lead", {
  refresh: function (frm) {
    frm.set_df_property("status", "options", [
      "Open",
      "Interested",
      "Replied [Demo Sheduled ]",
      "Quotation",
      "Demo Done",
      "Converted",
      "Not Interested",
      "Lost Quotation",
      "Call Himself",
    ]);
    frm.set_df_property("qualification_status", "options", [
      "Unqualified",
      "Yet to be called",
      "Qualified",
    ]);
  },
  onload: function (frm) {
    setTimeout(function () {
      frm.page.remove_inner_button("Opportunity", "Create");
      frm.page.remove_inner_button("Customer", "Create");
      frm.page.remove_inner_button("Prospect", "Create");

      // Hide the "Action" button
      frm.page.wrapper.find('[data-label="Action"]').hide();
    }, 100);
  },
});
