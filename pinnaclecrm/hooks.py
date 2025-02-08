app_name = "pinnaclecrm"
app_title = "Pinnacle CRM"
app_publisher = "OTPL"
app_description = "An app to manage pinnacle crm"
app_email = "satish@mytaxcafe.com"
app_license = "mit"


before_migrate = "pinnaclecrm.events.after_migration.after_migrate"


# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "pinnaclecrm",
# 		"logo": "/assets/pinnaclecrm/logo.png",
# 		"title": "Pinnacle CRM",
# 		"route": "/pinnaclecrm",
# 		"has_permission": "pinnaclecrm.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/pinnaclecrm/css/pinnaclecrm.css"
app_include_js = [
    "/assets/pinnaclecrm/js/naming_series.js"
    ]

# include js, css files in header of web template
# web_include_css = "/assets/pinnaclecrm/css/pinnaclecrm.css"
# web_include_js = "/assets/pinnaclecrm/js/pinnaclecrm.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "pinnaclecrm/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Lead" : "public/js/lead_customization.js",
    "Quotation" : "public/js/quotation_customization.js",
    "Sales Order" : "public/js/sales_order_customization.js",
    "Delivery Note" : "public/js/delivery_note_customization.js",
    "Sales Invoice" : "public/js/sales_invoice_customization.js",
    # "Quotation" : "public/js/customer_kyc.js",
    }
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "pinnaclecrm/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "pinnaclecrm.utils.jinja_methods",
# 	"filters": "pinnaclecrm.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "pinnaclecrm.install.before_install"
# after_install = "pinnaclecrm.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "pinnaclecrm.uninstall.before_uninstall"
# after_uninstall = "pinnaclecrm.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "pinnaclecrm.utils.before_app_install"
# after_app_install = "pinnaclecrm.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "pinnaclecrm.utils.before_app_uninstall"
# after_app_uninstall = "pinnaclecrm.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "pinnaclecrm.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	# "*": {
	# 	"on_update": "method",
	# 	"on_cancel": "method",
	# 	"on_trash": "method"
	# }
 
 "Customer": {
        "on_trash": "pinnaclecrm.events.dummy_customer.prevent_dummy_customer_deletion"
    },
 "Sales Order": {
     "before_save": "pinnaclecrm.events.so_before_save.custom_before_save"
 }
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"pinnaclecrm.tasks.all"
# 	],
# 	"daily": [
# 		"pinnaclecrm.tasks.daily"
# 	],
# 	"hourly": [
# 		"pinnaclecrm.tasks.hourly"
# 	],
# 	"weekly": [
# 		"pinnaclecrm.tasks.weekly"
# 	],
# 	"monthly": [
# 		"pinnaclecrm.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "pinnaclecrm.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "pinnaclecrm.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "pinnaclecrm.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["pinnaclecrm.utils.before_request"]
# after_request = ["pinnaclecrm.utils.after_request"]

# Job Events
# ----------
# before_job = ["pinnaclecrm.utils.before_job"]
# after_job = ["pinnaclecrm.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"pinnaclecrm.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

