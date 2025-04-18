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
                    "link_name": quotation.party_name,
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


@frappe.whitelist(allow_guest=True)
def create_customer_address(gst_data, customer):

    if gst_data == {}:
        return
    gst_data = json.loads(gst_data)
    address = gst_data.get("pradr").get("addr")
    if address.get("stcd") == "Uttar Pradesh":
        tx_category = "In-State"
    else:
        tx_category = "Out-State"

    new_address = frappe.get_doc(
        {
            "doctype": "Address",
            "docstatus": 0,
            "address_title": customer,
            "address_type": "Billing",
            "address_line1": address.get("bno"),
            "address_line2": address.get("st"),
            "city": address.get("dst"),
            "state": address.get("stcd"),
            "country": "India",
            "pincode": address.get("pncd"),
            "gstin": gst_data.get("gstin"),
            "gst_category": "Registered Regular",
            "tax_category": tx_category,
            "is_primary_address": 1,
            "is_your_company_address": 0,
        }
    )
    print(new_address)
    # Link the address to the customer
    new_address.append(
        "links",
        {
            "link_doctype": "Customer",
            "link_name": customer,
        },
    )

    # Insert the address
    new_address.insert()
    # Return success message

    frappe.db.set_value(
        "Customer", customer, "customer_primary_address", new_address.name
    )
    return {
        "message": "Address created and linked successfully",
        "status": 200,
    }


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

    customer = frappe.db.exists("Customer", {"gstin": gst_in})
    if customer:
        return {
            "status": 409,
            "message": "Customer already exists.",
            "customer": customer,
        }
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


@frappe.whitelist(allow_guest=True)
def create_customer(data):
    if data is None:
        return frappe.throw("No customer data found.")
    customer_data = json.loads(data)
    # Create a new Customer document
    customer = frappe.get_doc(
        {
            "doctype": "Customer",
            "customer_name": customer_data.get("cnm"),
            "customer_group": customer_data.get("cgrp"),
            "tax_category": customer_data.get("txcategory"),
            "custom_customer_id": customer_data.get("custid"),
            "gstin": customer_data.get("gstin"),
        }
    )

    customer.insert(ignore_permissions=True)
    frappe.db.commit()
    new_address = frappe.get_doc(
        {
            "doctype": "Address",
            "docstatus": 0,
            "address_title": customer.name,
            "address_type": "Billing",
            "address_line1": customer_data.get("bno"),
            "address_line2": customer_data.get("st"),
            "city": customer_data.get("dst"),
            "state": customer_data.get("stcd"),
            "country": "India",
            "pincode": customer_data.get("pncd"),
            "gstin": customer_data.get("gstin"),
            "gst_category": "Registered Regular",
            "tax_category": customer_data.get("txcategory"),
            "is_primary_address": 1,
            "is_your_company_address": 0,
        }
    )
    # Link the address to the customer
    new_address.append(
        "links",
        {
            "link_doctype": "Customer",
            "link_name": customer.name,
        },
    )

    # Insert the address
    new_address.insert()
    # Return success message

    frappe.db.set_value(
        "Customer", customer.name, "customer_primary_address", new_address.name
    )

    return {
        "message": "Customer and Address created successfully",
        "status": 200,
        "customer": customer.name,
        "address": new_address.name,
    }
