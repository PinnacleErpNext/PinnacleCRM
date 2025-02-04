import frappe
from frappe.model.mapper import get_mapped_doc
from frappe.utils import flt, getdate, nowdate
from erpnext.selling.doctype.quotation.quotation import _make_customer

@frappe.whitelist()
def make_sales_order(source_name: str, target_doc=None):
    """Creates a Sales Order from a Quotation, validating expiry."""
    
    # Check if expired quotations are allowed
    if not frappe.db.get_singles_value(
        "Selling Settings", "allow_sales_order_creation_for_expired_quotation"
    ):
        quotation = frappe.db.get_value(
            "Quotation", source_name, ["transaction_date", "valid_till"], as_dict=True
        )
        if quotation and quotation.valid_till:
            if quotation.valid_till < quotation.transaction_date or quotation.valid_till < getdate(nowdate()):
                frappe.throw(_("Validity period of this quotation has ended."))

    return _make_sales_order(source_name, target_doc)

def _make_sales_order(source_name, target_doc=None, ignore_permissions=False):
    """Custom function to map Quotation → Sales Order."""

    # Create Customer from Quotation
    customer = frappe.get_doc("Customer","Dummy Customer")
    
    # Get Ordered Items to prevent duplication
    ordered_items = frappe._dict(
        frappe.db.get_all(
            "Sales Order Item",
            filters={"prevdoc_docname": source_name, "docstatus": 1},
            fields=["item_code", "sum(qty) as qty"],
            group_by="item_code",
            as_list=1,
        )
    )

    # Ensure `frappe.flags.get("args")` is not None
    args = frappe.flags.get("args") or {}
    selected_rows = [x.get("name") for x in args.get("selected_items", [])]

    def set_missing_values(source, target):
        """Set customer and sales team in Sales Order."""
        if customer:
            target.customer = customer.name
            target.customer_name = customer.customer_name

            # Copy Sales Team from Customer if not present
            if not target.get("sales_team"):
                for d in customer.get("sales_team") or []:
                    target.append(
                        "sales_team",
                        {
                            "sales_person": d.sales_person,
                            "allocated_percentage": d.allocated_percentage or None,
                            "commission_rate": d.commission_rate,
                        },
                    )

        # Set Sales Partner if applicable
        if source.referral_sales_partner:
            target.sales_partner = source.referral_sales_partner
            target.commission_rate = frappe.get_value(
                "Sales Partner", source.referral_sales_partner, "commission_rate"
            )

        target.flags.ignore_permissions = ignore_permissions
        target.run_method("set_missing_values")
        target.run_method("calculate_taxes_and_totals")

    def update_item(obj, target, source_parent):
        """Updates item quantity and links Blanket Order."""
        balance_qty = obj.qty - ordered_items.get(obj.item_code, 0.0)
        target.qty = max(balance_qty, 0)
        target.stock_qty = flt(target.qty) * flt(obj.conversion_factor)

        if obj.against_blanket_order:
            target.against_blanket_order = obj.against_blanket_order
            target.blanket_order = obj.blanket_order
            target.blanket_order_rate = obj.blanket_order_rate

    def can_map_row(item) -> bool:
        """Ensures only valid rows are mapped from Quotation to Sales Order."""
        balance_qty = item.qty - ordered_items.get(item.item_code, 0.0)
        if balance_qty <= 0:
            return False

        if not selected_rows:
            return not item.is_alternative

        if item.is_alternative or item.has_alternative_item:
            return item.name in selected_rows and balance_qty > 0

        return balance_qty > 0

    doclist = get_mapped_doc(
        "Quotation",
        source_name,
        {
            "Quotation": {"doctype": "Sales Order", "validation": {"docstatus": ["=", 1]}},
            "Quotation Item": {
                "doctype": "Sales Order Item",
                "field_map": {"parent": "prevdoc_docname", "name": "quotation_item"},
                "postprocess": update_item,
                "condition": can_map_row,
            },
            "Sales Taxes and Charges": {"doctype": "Sales Taxes and Charges", "reset_value": True},
            "Sales Team": {"doctype": "Sales Team", "add_if_empty": True},
            "Payment Schedule": {"doctype": "Payment Schedule", "add_if_empty": True},
        },
        target_doc,
        set_missing_values,
        ignore_permissions=ignore_permissions,
    )

    return doclist
