import frappe
import json

# Mark lead converted
@frappe.whitelist(allow_guest=True)
def mark_lead_converted(doc):
    if not doc:
        return frappe.msgprint("No Doc Found!")

    doc = json.loads(doc)
    item = doc.get("items", [{}])[0]
    prevdoc_name = item.get("prevdoc_docname")

    if not prevdoc_name:
        return

    # Fetch required fields in one go to reduce DB hits
    quotation = frappe.db.get_value(
        "Quotation", prevdoc_name, ["quotation_to", "party_name"], as_dict=True
    )

    if not quotation:
        return frappe.msgprint(f"Quotation {prevdoc_name} not found.")

    if quotation.quotation_to == "Lead":
        frappe.db.set_value("Lead", quotation.party_name, "status", "Converted")
        frappe.db.commit()
        return frappe.msgprint(f"Lead: {quotation.party_name} marked as converted!")
    else:
        return frappe.msgprint(f"Quotation is not linked to a Lead.")