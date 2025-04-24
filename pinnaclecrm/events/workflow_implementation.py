import frappe
from erpnext.selling.doctype.sales_order.sales_order import make_sales_invoice


def skip_delivery_note(self, method):
    skip_dn = ("SO-G-.FY.-.#.", "SO-GR-.FY.-.#.", "SO-D-.FY.-.#.")
    if self.naming_series in skip_dn:
        self.skip_delivery_note = 1


def update_sales_order_status(self, method):
    if self.naming_series in ["SO-G-.FY.-.#.", "SO-GR-.FY.-.#."]:

        if self.custom_payment_mode == "Free":
            # Make the Sales Invoice from the Sales Order
            invoice = make_sales_invoice(self.name)

            # Set any additional fields if needed
            invoice.flags.ignore_permissions = (
                True  # Optional, if user doesn't have Invoice permission
            )
            invoice.set_missing_values()
            invoice.insert()

            # Submit the Sales Invoice
            invoice.submit()

            frappe.msgprint(
                f"Sales Invoice {invoice.name} created and submitted for Free order."
            )
    elif self.naming_series in ["SO-D-.FY.-.#."]:
        if self.custom_payment_mode == "Free":
            # Make the Sales Invoice from the Sales Order
            invoice = make_sales_invoice(self.name)

            # Set any additional fields if needed
            invoice.flags.ignore_permissions = (
                True  # Optional, if user doesn't have Invoice permission
            )
            invoice.set_missing_values()
            invoice.insert()

            # Submit the Sales Invoice
            invoice.submit()

            frappe.msgprint(
                f"Sales Invoice {invoice.name} created and submitted for Free order."
            )
    elif self.naming_series in ["SO-A-.FY.-.#.", "SO-AR-.FY.-.#."]:
        if self.custom_payment_mode == "Free":
            # Make the Sales Invoice from the Sales Order
            invoice = make_sales_invoice(self.name)

            # Set any additional fields if needed
            invoice.flags.ignore_permissions = (
                True  # Optional, if user doesn't have Invoice permission
            )
            invoice.set_missing_values()
            invoice.insert()

            # Submit the Sales Invoice
            invoice.submit()

            frappe.msgprint(
                f"Sales Invoice {invoice.name} created and submitted for Free order."
            )
