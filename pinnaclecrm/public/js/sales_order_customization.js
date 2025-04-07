var original_sales_order_onload =
  frappe.listview_settings["Sales Order"].onload;

frappe.listview_settings["Sales Order"] = {
  add_fields: [
    "base_grand_total",
    "customer_name",
    "currency",
    "delivery_date",
    "per_delivered",
    "per_billed",
    "status",
    "order_type",
    "name",
    "skip_delivery_note",
  ],
  get_indicator: function (doc) {
    if (doc.status === "Closed") {
      return [__("Closed"), "green", "status,=,Closed"];
    } else if (doc.status === "On Hold") {
      return [__("On Hold"), "orange", "status,=,On Hold"];
    } else if (doc.status === "Completed") {
      return [__("Completed"), "green", "status,=,Completed"];
    } else if (!doc.skip_delivery_note && flt(doc.per_delivered) < 100) {
      if (frappe.datetime.get_diff(doc.delivery_date) < 0) {
        return [
          __("Overdue"),
          "red",
          "per_delivered,<,100|delivery_date,<,Today|status,!=,Closed",
        ];
      } else if (flt(doc.grand_total) === 0) {
        return [
          __("To Deliver"),
          "orange",
          "per_delivered,<,100|grand_total,=,0|status,!=,Closed",
        ];
      } else if (flt(doc.per_billed) < 100) {
        return [
          __("To Deliver and Bill"),
          "orange",
          "per_delivered,<,100|per_billed,<,100|status,!=,Closed",
        ];
      } else {
        return [
          __("To Deliver"),
          "orange",
          "per_delivered,<,100|per_billed,=,100|status,!=,Closed",
        ];
      }
    } else if (
      flt(doc.per_delivered) === 100 &&
      flt(doc.grand_total) !== 0 &&
      flt(doc.per_billed) < 100
    ) {
      return [
        __("To Bill"),
        "orange",
        "per_delivered,=,100|per_billed,<,100|status,!=,Closed",
      ];
    } else if (doc.skip_delivery_note && flt(doc.per_billed) < 100) {
      return [__("To Bill"), "orange", "per_billed,<,100|status,!=,Closed"];
    }
  },
  onload: function (listview) {
    if (original_sales_order_onload) {
      original_sales_order_onload(listview);
    }

    let user_email = frappe.boot.user.email || frappe.session.user_email;
    if (user_email) {
      console.log("User Email:", user_email);
      if (
        ["abhishek.porwal@pinnaclefsa.co.in", "arjit@mytaxcafe.com"].includes(
          user_email
        )
      ) {
        console.log("Applying route options...");
        frappe.route_options = {
          custom_payment_mode: ["in", ["Credit", "Others"]],
        };

        listview.refresh();
      }
    }
  },
};

frappe.ui.form.on("Sales Order", {
  naming_series: function (frm) {
    pinnaclecrm.utils.applyItemGroupFilter(frm);
    pinnaclecrm.utils.applyCustomerGroupFilter(frm, "customer");
  },
  refresh: function (frm) {
    if (frm.is_new()) {
      frm.set_value("naming_series", "");
      frm.set_value("delivery_date", "2080-01-01");
    }
    if (!frm.page.wrapper[0]) return;

    // Define the array of button labels that should be removed
    let buttonsToHide = [
      "Pick List",
      "Work Order",
      "Material Request",
      "Request For Raw Materials",
      "Purchase Order",
      "Project",
      "Payment Request",
    ];

    // Flag to indicate whether any unwanted button was removed
    let removed = false;

    // Create a MutationObserver to watch for changes in the page wrapper
    let observer = new MutationObserver((mutations, observerInstance) => {
      // Check if the inner toolbar exists
      if (frm.page.inner_toolbar) {
        // Find all dropdown items inside the dropdown menu
        frm.page.inner_toolbar
          .find(".dropdown-menu .dropdown-item")
          .each(function () {
            // Get the trimmed text of the button
            let btnText = $(this).text().trim();

            // Compare in a case-insensitive way:
            let shouldHide = buttonsToHide.some(
              (btn) => btn.toLowerCase() === btnText.toLowerCase()
            );

            // If the button's label matches one in our list, remove it
            if (shouldHide) {
              $(this).remove();
              removed = true;
            }
          });
      }

      // Disconnect the observer after making changes
      if (removed) {
        observerInstance.disconnect();
      }
    });

    // Start observing changes in the page wrapper element
    observer.observe(frm.page.wrapper[0], { childList: true, subtree: true });

    // Check if the document is new and the first item's prevdoc_docname exists
    if (
      frm.is_new() &&
      frm.doc.items &&
      frm.doc.items.length > 0 &&
      frm.doc.items[0].prevdoc_docname
    ) {
      frappe.db
        .get_value(
          "Property Setter",
          { doc_type: frm.doc.doctype, property: "options" },
          "value"
        )
        .then((res) => {
          if (res.message && res.message.value) {
            // Split the options into an array and trim each option
            let naming_series_array = res.message.value
              .split("\n")
              .map((option) => option.trim());

            // Find the appropriate naming series based on prevdoc_docname
            let prevdoc_name = frm.doc.items[0].prevdoc_docname;
            let selected_series = naming_series_array.find((item) => {
              if (prevdoc_name.includes("-A-") && item.includes("-A-"))
                return true;
              if (prevdoc_name.includes("-G-") && item.includes("-G-"))
                return true;
              if (prevdoc_name.includes("-D-") && item.includes("-D-"))
                return true;
              if (prevdoc_name.includes("-GR-") && item.includes("-GR-"))
                return true;
              if (prevdoc_name.includes("-AR-") && item.includes("-AR-"))
                return true;
              return false;
            });
            if (!selected_series) {
              frappe.show_alert({
                message: __("Series Migration Failed!"),
                indicator: "red",
              });
            }
            // Set the selected naming series or fallback to the first option
            frm.set_value(
              "naming_series",
              selected_series || naming_series_array[0]
            );

            // Make the naming series field read-only
            frm.set_df_property("naming_series", "read_only", true);
            pinnaclecrm.utils.applyItemGroupFilter(frm);
          } else {
            console.log("No options found for naming_series");
            frm.set_value("naming_series", "");
          }
        })
        .catch((err) => {
          console.error("Error fetching Property Setter:", err);
          frappe.msgprint({
            title: __("Error"),
            message: __("There was an issue fetching the Property Setter."),
            indicator: "red",
          });
          frm.set_value("naming_series", "");
        });
    } else {
      console.log("Document is not new or prevdoc_docname is not available.");
    }
  },
});
