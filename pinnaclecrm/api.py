import frappe
import json
from erpnext.selling.doctype.quotation.quotation import _make_customer

@frappe.whitelist()
def create_customer(address, src):
    address = json.loads(address)
    print(address)
    print(src)
    try:
        # Create the customer (assumes _make_customer is defined and works as expected)
        customer = _make_customer(src, ignore_permissions=False)
        
        # Create the address
        newAddress = frappe.get_doc({
            "doctype": 'Address',
            "docstatus": 0,
            "address_title": customer.name,
            "address_type": address.get('address_type'),
            "address_line1": address.get('address_line_1'),
            "city": address.get('city'),
            "state": address.get('state'),
            "country": address.get('country'),
            "pincode": address.get('postal_code'),
            "gstin": address.get('gst_in'),
            "gst_category": address.get('gst_category'),
        })

        # Link the address to the customer
        newAddress.append(
            "links", {
                "link_doctype": "Customer",
                "link_name": customer.name  # Use customer.name, not the object itself
            }
        )

        # Insert the address
        newAddress.insert()

        # Return success message
        return {"message": "Customer and Address created successfully", "status": 200}
    
    except Exception as e:
        # Handle any errors that occur
        frappe.log_error(f"Error in creating customer or address: {str(e)}")
        return {"message": f"Error: {str(e)}", "status": 500}

#API for migration
@frappe.whitelist(allow_guest=True)
def after_migrate():
    parent_doctype = "Lead"
    fieldname_to_update = "status"  

    # Define the new options
    new_options = ["Open","Interested","Replied [Demo Sheduled ]","Quotation","Demo Done","Converted","Not Interested","Lost Quotation","Call Himself","Lead","Replied","Opportunity","Interested","Do Not Contact"]

    # Convert the list to a newline-separated string
    options_string = "\n".join(new_options)

    # Update the options for the specified field
    frappe.db.set_value(
        "DocField",
        {"parent": parent_doctype, "fieldname": fieldname_to_update},
        "options",
        options_string
    )

    # Commit the changes to the database
    frappe.db.commit()
