import frappe
from frappe import _
from pinnaclecrm.pinnacle_crm.validations.validations import validate_document


def validation(self, method):
    field_list = (
        "naming_series",
        "customer",
        "custom_payment_mode",
        "items",
        "sales_team",
        "contact_person",
        "customer_address",
        "taxes",
    )
    validate_document(self, method, field_list)
    _sales_type_validation(self, method)


def _sales_type_validation(self, method):
    if "-GR-" in self.naming_series or "-AR-" in self.naming_series:
        if self.custom_sales_type != "Renewal":
            frappe.throw(_("Please set sales type as renewal!"))
    elif "-G-" in self.naming_series or "-A-" in self.naming_series:
        if self.custom_sales_type != "Fresh":
            frappe.throw(_("Please set sales type as fresh!"))
