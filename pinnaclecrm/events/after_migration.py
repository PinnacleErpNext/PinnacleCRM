import frappe
from pinnaclecrm.events.dummy_customer import create_dummy_customer


# task needs to be done after migrate
@frappe.whitelist(allow_guest=True)
def after_migrate():
    
    # create_dummy_customer()
    
    parent_doctype = "Lead"

    # Fields and new options to add
    fields_to_update = {
        "status": [
            "Open", "Interested", "Replied [Demo Scheduled]", "Quotation", "Demo Done",
            "Converted", "Not Interested", "Lost Quotation", "Call Himself",],
        "qualification_status": [
            "Yet to be called"
        ]
    }

    for fieldname, new_options in fields_to_update.items():
        # Fetch existing options
        existing_options = frappe.db.get_value(
            "DocField", {"parent": parent_doctype, "fieldname": fieldname}, "options"
        )

        # Convert existing options to a list (if not None)
        if existing_options:
            existing_options_list = existing_options.split("\n")
        else:
            existing_options_list = []

        # Add new options without duplicates
        updated_options = list(dict.fromkeys(existing_options_list + new_options))

        # Convert back to a newline-separated string
        options_string = "\n".join(updated_options)

        # Update the options for the specified field
        frappe.db.set_value(
            "DocField",
            {"parent": parent_doctype, "fieldname": fieldname},
            "options",
            options_string
        )

    # Commit the changes to the database
    frappe.db.commit()
