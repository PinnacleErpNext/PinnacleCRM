import frappe
from frappe import _
from pinnaclecrm.pinnacle_crm.validations.validations import validate_document


def validation(self, method):
    field_list = (
        "naming_series",
        "customer",
        "posting_date",
        "posting_time",
        "items",
        "taxes",
        "customer_address",
        "contact_person",
    )
    validate_document(self, method, field_list)
