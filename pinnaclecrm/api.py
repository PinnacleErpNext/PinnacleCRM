import frappe
import requests
from frappe import _
import json
from erpnext.selling.doctype.quotation.quotation import _make_customer
from erpnext.selling.doctype.quotation.quotation import make_sales_order


@frappe.whitelist(allow_guest=True)
def create_and_update_address(address, src, addr_name=None):
    address = json.loads(address)
    try:
        # Create the customer (assumes _make_customer is defined and works as expected)
        quotation = frappe.get_doc("Quotation", src)
        # frappe.throw(quotation.party_name)
        if addr_name is not None:
            addr_doc = frappe.get_doc("Address", addr_name)

            addr_doc.update(
                {
                    "address_title": quotation.party_name,
                    "address_type": address.get("address_type"),
                    "address_line1": address.get("address_line1"),
                    "address_line2": address.get("address_line2"),
                    "city": address.get("city"),
                    "state": address.get("state"),
                    "country": address.get("country"),
                    "pincode": address.get("pincode"),
                    "gstin": address.get("gstin"),
                    "gst_category": address.get("gst_category"),
                    "is_primary_address": 1,
                }
            )
            addr_doc.save()
            return {
                "message": "Customer Address updated successfully",
                "status": 200,
            }
        else:
            # Create the address
            newAddress = frappe.get_doc(
                {
                    "doctype": "Address",
                    "docstatus": 0,
                    "address_title": quotation.party_name,
                    "address_type": address.get("address_type"),
                    "address_line1": address.get("address_line1"),
                    "address_line2": address.get("address_line2"),
                    "city": address.get("city"),
                    "state": address.get("state"),
                    "country": address.get("country"),
                    "pincode": address.get("pincode"),
                    "gstin": address.get("gstin"),
                    "gst_category": address.get("gst_category"),
                    "is_primary_address": 1,
                }
            )

            # Link the address to the customer
            newAddress.append(
                "links",
                {
                    "link_doctype": quotation.quotation_to,
                    "link_name": quotation.party_name,  # Use customer.name, not the object itself
                },
            )

            # Insert the address
            newAddress.insert()

            # Return success message
            return {
                "message": "Customer Address created successfully",
                "status": 200,
            }

    except Exception as e:
        # Handle any errors that occur
        frappe.log_error(f"Error in creating customer or address: {str(e)}")
        return {"message": f"Error: {str(e)}", "status": 500}


# API get address
@frappe.whitelist(allow_guest=True)
def get_address(docname):
    # Fetch Quotation document
    try:
        quotation = frappe.get_doc("Quotation", docname)
    except frappe.DoesNotExistError:
        frappe.throw(_("Quotation {0} not found").format(docname))

    # SQL Query to fetch address
    query = """
        SELECT 
            a.name,
            a.address_title,
            a.address_type,
            a.address_line1,
            a.address_line2,
            a.city,
            a.state,
            a.country,
            a.pincode,
            a.is_primary_address,
            a.is_shipping_address,
            a.gstin,
            a.gst_category,
            dl.link_name,
            dl.link_doctype
        FROM 
            `tabAddress` AS a
        INNER JOIN 
            `tabDynamic Link` dl
        ON 
            dl.parent = a.name
        WHERE 
            a.docstatus = 0
        AND 
            dl.link_doctype = %s
        AND 
            dl.link_name = %s
        ORDER BY a.creation DESC
        LIMIT 1
    """

    # First attempt: Fetch based on Quotation name
    filter_values = ["Quotation", quotation.name]
    address = frappe.db.sql(query, filter_values, as_dict=True)

    # If no address found, try fetching based on the linked party (Customer/Supplier)
    if not address:
        filter_values = [quotation.quotation_to, quotation.party_name]
        address = frappe.db.sql(query, filter_values, as_dict=True)

    # Return results as JSON
    return address


@frappe.whitelist(allow_guest=True)
def get_gstin_details(gst_in):
    url = f"https://gstapi.mygstcafe.com/managed/commonapi/v1.1/search?gstin={gst_in}"
    headers = {
        "CustomerId": "ASP10012",
        "APIId": "OxponS51-sL1l-RXig-WBlb-WvnFzYwA",
        "APISecret": "mBFqeAZdRrMZSRE",
        "environment-type": "Production",
    }
    response = requests.get(url, headers=headers)
    data = response.json()
    return data
