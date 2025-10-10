# import frappe
# from frappe import _

# def ensure_custom_html_block_v15(
#     block_name,
#     html,
#     style=None,
#     script=None,
#     private=False,
#     allowed_roles=None
# ):
#     """
#     Create or update a Custom HTML Block (Frappe v15) with visibility control.

#     Parameters:
#     - block_name (str): Unique name for the block
#     - html (str): HTML content of the block
#     - style (str, optional): CSS content
#     - script (str, optional): JS content
#     - private (bool): Whether block is private
#     - allowed_roles (list of str, optional): Roles allowed to see the block (if roles table exists)

#     Returns:
#     - block_doc: The Custom HTML Block document created/updated
#     """

#     doctype = "Custom HTML Block"
#     meta = frappe.get_meta(doctype)

#     # Determine if optional fields exist
#     has_style = meta.get_field("style") is not None
#     has_script = meta.get_field("script") is not None
#     has_private = meta.get_field("private") is not None
#     has_roles_table = meta.get_field("roles") is not None

#     # Must have html field
#     if meta.get_field("html") is None:
#         frappe.throw(_("DocType '{0}' does not have field 'html'").format(doctype))

#     # Check existing
#     existing = frappe.db.get_value(doctype, block_name, "name")

#     if existing:
#         block = frappe.get_doc(doctype, existing)
#         changed = False

#         # html
#         if block.html != html:
#             block.html = html
#             changed = True

#         # style / CSS
#         if style is not None:
#             if has_style:
#                 if block.style != style:
#                     block.style = style
#                     changed = True
#             else:
#                 frappe.logger().warning(f"Block '{block_name}' missing field 'style', ignoring style parameter")

#         # script / JS
#         if script is not None:
#             if has_script:
#                 if block.script != script:
#                     block.script = script
#                     changed = True
#             else:
#                 frappe.logger().warning(f"Block '{block_name}' missing field 'script', ignoring script parameter")

#         # private
#         if has_private:
#             if block.private != private:
#                 block.private = private
#                 changed = True
#         else:
#             frappe.logger().warning(f"Block '{block_name}' missing field 'private', ignoring private parameter")

#         # allowed roles
#         if allowed_roles is not None and has_roles_table:
#             # Normalize roles
#             allowed_roles = list(set(allowed_roles))
#             existing_roles = [r.role for r in block.get("roles") or []]
#             if set(existing_roles) != set(allowed_roles):
#                 # Reset and set new roles
#                 block.set("roles", [])
#                 for r in allowed_roles:
#                     block.append("roles", {"role": r})
#                 changed = True
#         elif allowed_roles is not None:
#             # roles table doesn't exist
#             frappe.logger().warning(f"Block '{block_name}' missing 'roles' table, ignoring allowed_roles parameter")

#         if changed:
#             block.flags.ignore_permissions = True
#             block.save()
#             frappe.db.commit()
#             frappe.logger().info(f"Custom HTML Block '{block_name}' updated")
#         else:
#             frappe.logger().info(f"No change needed for Custom HTML Block '{block_name}'")

#         return block

#     else:
#         # Create new
#         data = {
#             "doctype": doctype,
#             "__newname": block_name,
#             "html": html
#         }
#         if style is not None and has_style:
#             data["style"] = style
#         if script is not None and has_script:
#             data["script"] = script
#         if has_private:
#             data["private"] = private

#         block = frappe.get_doc(data)

#         if allowed_roles is not None and has_roles_table:
#             for r in allowed_roles:
#                 block.append("roles", {"role": r})

#         block.flags.ignore_permissions = True
#         block.insert()
#         frappe.db.commit()
#         frappe.logger().info(f"Custom HTML Block '{block_name}' created")
#         return block


# def attach_block_to_workspace_v15(workspace_name, block_doc, label=None):
#     """
#     Ensure that the Custom HTML Block (block_doc) is attached to the given workspace.
#     If already attached, optionally update its label.
#     """
#     try:
#         ws = frappe.get_doc("Workspace", workspace_name)
#     except frappe.DoesNotExistError:
#         frappe.throw(_("Workspace '{0}' not found").format(workspace_name))

#     existing = [cb.custom_block_name for cb in ws.get("custom_blocks", [])]

#     if block_doc.name not in existing:
#         ws.append("custom_blocks", {
#             "custom_block_name": block_doc.name,
#             "label": label or block_doc.name
#         })
#         ws.flags.ignore_permissions = True
#         ws.save()
#         frappe.db.commit()
#         frappe.logger().info(f"Attached custom block '{block_doc.name}' to workspace '{workspace_name}'")
#     else:
#         # update label if changed
#         for cb in ws.get("custom_blocks", []):
#             if cb.custom_block_name == block_doc.name:
#                 desired_label = label or block_doc.name
#                 if cb.label != desired_label:
#                     cb.label = desired_label
#                     ws.flags.ignore_permissions = True
#                     ws.save()
#                     frappe.db.commit()
#                     frappe.logger().info(f"Updated label for block '{block_doc.name}' in workspace '{workspace_name}'")
#                 break


# def clear_custom_blocks_from_workspace(workspace_name):
#     """
#     Remove all custom blocks attached to a workspace.
#     """
#     try:
#         ws = frappe.get_doc("Workspace", workspace_name)
#     except frappe.DoesNotExistError:
#         frappe.throw(_("Workspace '{0}' not found").format(workspace_name))

#     before = [cb.custom_block_name for cb in ws.get("custom_blocks", [])]
#     if before:
#         frappe.logger().info(f"Clearing custom_blocks in workspace '{workspace_name}', before: {before}")
#         ws.set("custom_blocks", [])
#         ws.flags.ignore_permissions = True
#         ws.save()
#         frappe.db.commit()


# def setup_custom_blocks_for_workspaces(block_configs):
#     """
#     Takes a list of block configurations and ensures they are created and attached.

#     block_configs: list of dicts with keys:
#       - workspace_name (str)
#       - block_name (str)
#       - html (str)
#       - style (str, optional)
#       - script (str, optional)
#       - private (bool, optional, default False)
#       - allowed_roles (list of str, optional)
#       - label (str, optional)
#     """

#     for cfg in block_configs:
#         workspace_name = cfg["workspace_name"]
#         block_name = cfg["block_name"]
#         html = cfg["html"]
#         style = cfg.get("style")
#         script = cfg.get("script")
#         private = cfg.get("private", False)
#         allowed_roles = cfg.get("allowed_roles")
#         label = cfg.get("label")

#         # Create/update block
#         block_doc = ensure_custom_html_block_v15(
#             block_name=block_name,
#             html=html,
#             style=style,
#             script=script,
#             private=private,
#             allowed_roles=allowed_roles
#         )

#         # Attach to workspace
#         attach_block_to_workspace_v15(workspace_name, block_doc, label=label)


# # Example usage wrapper
# def setup_custom_blocks():
#     block_configs = [
#         {
#             "workspace_name": "Selling",
#             "block_name": "Selling Dashboard",
#             "html": """
#                 <div class="selling-dashboard">
#                     <h2>📊 Selling Dashboard</h2>
#                     <p>Welcome to your Selling Overview!</p>
#                 </div>
#             """,
#             "style": """
#                 .selling-dashboard {
#                     background: #f8fafc;
#                     border: 1px solid #e2e8f0;
#                     padding: 15px;
#                     border-radius: 8px;
#                     text-align: center;
#                 }
#                 .selling-dashboard h2 {
#                     color: #2563eb;
#                     margin-bottom: 5px;
#                 }
#             """,
#             "script": None,
#             "private": False,
#             "allowed_roles": ["System Manager", "Sales Manager"],
#             "label": "Selling Dashboard"
#         },
#         {
#             "workspace_name": "Buying",
#             "block_name": "Buying Dashboard",
#             "html": "<div><strong>Buying Summary</strong></div>",
#             "style": None,
#             "script": None,
#             "private": False,
#             "allowed_roles": ["System Manager", "Purchase Manager"],
#             "label": "Buying Dashboard"
#         }
#         # Add more blocks for more workspaces as needed
#     ]
#     setup_custom_blocks_for_workspaces(block_configs)


import frappe
import json
from frappe import _

def remove_custom_block_from_workspace(workspace_name, block_name):
    """
    Remove a single custom HTML block identified by block_name from the workspace:
    - remove from custom_blocks child table
    - remove from content JSON layout
    """
    try:
        ws = frappe.get_doc("Workspace", workspace_name)
    except frappe.DoesNotExistError:
        frappe.throw(_("Workspace '{0}' not found").format(workspace_name))

    changed = False

    # Remove from custom_blocks child table
    # Filter out the block
    filtered = [cb for cb in ws.get("custom_blocks", []) if cb.custom_block_name != block_name]
    if len(filtered) != len(ws.get("custom_blocks", [])):
        ws.set("custom_blocks", [])
        for cb in filtered:
            ws.append("custom_blocks", {
                "custom_block_name": cb.custom_block_name,
                "label": cb.label
            })
        changed = True
        frappe.logger().info(f"Removed custom block '{block_name}' from custom_blocks of workspace '{workspace_name}'")

    # Remove from content JSON
    content = []
    if ws.content:
        try:
            content = json.loads(ws.content)
        except (json.JSONDecodeError, TypeError):
            content = []
    # Filter out entries where block_name matches
    new_content = []
    for b in content:
        if b.get("type") == "custom" and b.get("data", {}).get("block_name") == block_name:
            # skip this block
            frappe.logger().info(f"Removing block '{block_name}' from workspace content layout in '{workspace_name}'")
            continue
        new_content.append(b)

    if new_content != content:
        ws.content = json.dumps(new_content)
        changed = True

    # If anything changed, save
    if changed:
        ws.flags.ignore_permissions = True
        ws.save()
        frappe.db.commit()
        frappe.logger().info(f"Workspace '{workspace_name}' updated after removing block '{block_name}'")
    else:
        frappe.logger().info(f"No custom block '{block_name}' found in workspace '{workspace_name}', nothing to remove")


def clear_all_custom_blocks_and_layout(workspace_name):
    """
    Remove all custom HTML blocks from the workspace,
    clear the layout JSON content as well.
    """
    try:
        ws = frappe.get_doc("Workspace", workspace_name)
    except frappe.DoesNotExistError:
        frappe.throw(_("Workspace '{0}' not found").format(workspace_name))

    existing = [cb.custom_block_name for cb in ws.get("custom_blocks", [])]
    if existing:
        frappe.logger().info(f"Clearing all custom blocks {existing} from workspace '{workspace_name}'")
        ws.set("custom_blocks", [])
    else:
        frappe.logger().info(f"No custom_blocks to clear from workspace '{workspace_name}'")

    # Clear content layout
    # Could be reset to empty list, or to default layout if you have one
    ws.content = json.dumps([])
    frappe.db.commit()

    ws.flags.ignore_permissions = True
    ws.save()
    frappe.db.commit()
    frappe.logger().info(f"Workspace '{workspace_name}' content layout reset to empty")


# Example usage
def remove_example_selling_dashboard():
    remove_custom_block_from_workspace("Selling", "Selling Dashboard")
