import frappe
from erpnext.selling.doctype.sales_order.sales_order import make_sales_invoice


# Skip delivery note for sales order.
def skip_delivery_note(self, method):
    skip_dn = ("SO-G-.FY.-.#.", "SO-GR-.FY.-.#.", "SO-D-.FY.-.#.")
    if self.naming_series in skip_dn:
        self.skip_delivery_note = 1


# Mark sales order completed after submit.
def update_sales_order_status(self, method):
    if (
        self.naming_series in ["SO-G-.FY.-.#.", "SO-GR-.FY.-.#.", "SO-D-.FY.-.#."]
        and self.custom_payment_mode == "Free"
    ):
        frappe.db.set_value(
            "Sales Order",
            self.name,
            {"per_billed": 100, "status": "Completed"},
        )
        frappe.db.commit()


# Mark sales order completed when delivery note submitted and mark delivery note completed also if sales order is of free type.
def mark_so_completed(self, method):

    if self.items[0].against_sales_order:
        sales_order = frappe.get_doc("Sales Order", self.items[0].against_sales_order)
        if sales_order.custom_payment_mode == "Free":
            frappe.db.set_value(
                "Sales Order",
                sales_order.name,
                {"per_billed": 100, "status": "Completed"},
            )
            frappe.db.set_value(
                "Delivery Note",
                self.name,
                {"per_billed": 100, "status": "Completed"},
            )
            frappe.db.commit()
