import frappe
from frappe import _


def validate_document(doc, method, field_list):
    """
    Enforce on Sales Order, Delivery Note, Sales Invoice:
      1. customer_id mandatory if series contains -GR- or -AR-
      2. unregistered customers must have name & email
      3. every item’s item_group must match the mapping for this series
      4. generic field_list checker (optional use)
    """

    _check_customer_id(doc)
    _check_unregistered_customer(doc)
    _check_item_group(doc)
    _check_mandatory_fields(doc, field_list)


def _check_customer_id(doc):
    if any(tag in (doc.naming_series or "") for tag in ("-GR-", "-AR-")):
        if not doc.get("custom_customer_id"):
            frappe.throw(
                _("Please enter Customer ID when series includes -GR- or -AR-")
            )


def _check_unregistered_customer(doc):
    # assuming you use a Link or Select field called "customer_type"
    if doc.get("customer_type") == "Unregistered Customer":
        if not doc.get("custom_unregistered_customer_name") or not doc.get(
            "custom_email_id"
        ):
            frappe.throw(
                _(
                    "Please enter both Customer Name and Email for unregistered customers"
                )
            )


def _check_item_group(doc):

    series_map = frappe.db.sql(
        """
        SELECT select_series, item_group
          FROM `tabItem Group Map`
         WHERE parent = %s
        """,
        (doc.doctype,),
        as_dict=True,
    )
    series_to_group = {row.select_series: row.item_group for row in series_map}

    target_group = series_to_group.get(doc.naming_series)
    if not target_group:

        return

    for idx, row in enumerate(doc.get("items") or [], start=1):
        actual_group = frappe.db.get_value("Item", row.item_code, "item_group")
        if actual_group != target_group:
            frappe.throw(
                _(
                    "Row {0}: Item {1} belongs to group {2}, but series {3} requires group {4}"
                ).format(
                    idx, row.item_code, actual_group, doc.naming_series, target_group
                )
            )


def _check_mandatory_fields(doc, field_list=None):
    """
    Generic helper: if any field in field_list is falsy,
    throws a message listing the missing ones.
    """
    missing = [f for f in field_list if not doc.get(f)]
    if missing:
        frappe.throw(
            _("Please fill mandatory field(s): {0}").format(", ".join(missing))
        )
