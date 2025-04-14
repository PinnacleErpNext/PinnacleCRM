import frappe
from erpnext.selling.doctype.sales_order.sales_order import SalesOrder


class CustomSalesOrder(SalesOrder):
    def get_context(self, context):
        # Compute additional context for templates or reports.
        context.custom_customer_id = self.get_customer_id(self)
        return context

    def get_customer_id(self):
        # Custom server-side logic for your computed field.
        customer = self.customer
        if customer in [
            "UNREGISTERED CUSTOMER [WITHIN UP ] [API CUST]",
            "UNREGISTERED CUSTOMER [OUTSIDE UP ] [API CUST]",
        ]:
            return frappe.db.get_value(
                "Customer ID",
                {
                    "customer_type": "UN-Registered",
                    "customer_name": self.custom_unregistered_customer_name,
                },
                ["customer_id"],
            )

        return frappe.db.get_value(
            "Customer ID",
            {"customer_type": "Registered", "customer": customer},
            ["customer_id"],
        )
