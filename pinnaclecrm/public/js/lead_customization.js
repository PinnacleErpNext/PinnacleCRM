frappe.ui.form.on("Lead", {
  naming_series: function (frm) {
    pinnaclecrm.utils.applyItemGroupFilter(frm);
  },
  refresh: function (frm) {
    let observer = new MutationObserver((mutations, observer) => {
      let button = frm.page.wrapper.find('[data-label="Action"]');
      if (button.length) {
        button.hide();
        frm.page.remove_inner_button("Opportunity", "Create");
        frm.page.remove_inner_button("Customer", "Create");
        frm.page.remove_inner_button("Prospect", "Create");
        observer.disconnect();
      }
    });

    observer.observe(frm.page.wrapper[0], { childList: true, subtree: true });

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
});
