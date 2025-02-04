import frappe
from erpnext.selling.doctype.quotation.quotation import _make_customer

def custom_before_save(self, method):
    """Before saving a Sales Order, ensure the Customer is created from Quotation."""

    if not self.items:
        return  # No items, do nothing

    quotation = self.items[0].prevdoc_docname
    if not quotation:
        return  # No linked quotation, do nothing

    # Generate Customer from Quotation
    customer = _make_customer(quotation, ignore_permissions=False)
    
    # Assign Customer details
    self.customer = customer.name
    self.customer_name = customer.customer_name
    self.customer_address = customer.customer_primary_address
