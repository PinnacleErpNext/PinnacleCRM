import frappe
from erpnext.selling.doctype.sales_order.sales_order import make_sales_invoice


def skip_delivery_note(self, method):
    skip_dn = ("SO-G-.FY.-.#.", "SO-GR-.FY.-.#.", "SO-D-.FY.-.#.")
    if self.naming_series in skip_dn:
        self.skip_delivery_note = 1


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
