import frappe
from frappe import _

# Creates a dummy customer if do not exists
def create_dummy_customer():
    """Creates a Dummy Customer if it doesn't already exist."""
    customer_name = "Dummy Customer"
    
    # Check if Dummy Customer already exists
    if frappe.db.exists("Customer", customer_name):
        frappe.msgprint(f"Customer '{customer_name}' already exists.", alert=True)
        return frappe.get_doc("Customer", customer_name)

    try:
        # Create a new Customer document
        customer = frappe.get_doc({
            "doctype": "Customer",
            "customer_name": customer_name,
            "customer_type": "Company",  # or "Individual" based on use case
            "customer_group": "All Customer Groups",  # Ensure this group exists
            "territory": "All Territories",  # Ensure this territory exists
            "customer_status": "Active",
            "default_currency": frappe.defaults.get_global_default("currency"),
            "tax_id": "",
            "custom_fields": {}  # Add any additional custom fields if required
        })

        # Insert the Customer record
        customer.insert(ignore_permissions=True)
        frappe.db.commit()

        frappe.msgprint(f"Dummy Customer '{customer_name}' created successfully.", alert=True)
        return customer

    except Exception as e:
        frappe.log_error(f"Error creating Dummy Customer: {str(e)}", "Dummy Customer Creation")
        frappe.throw(f"Failed to create Dummy Customer: {str(e)}")

# Prevents customer from being deleted
def prevent_dummy_customer_deletion(doc, method):
    if doc.name == "Dummy Customer":
        frappe.throw(_("You cannot delete the standard Dummy Customer."))