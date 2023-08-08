/* Business rule to make attachment mandatory on close */

function onBefore(current, previous) {
  var document = "";
  var msg = "";
  var control = true;

  if (current.u_catalog_item == "catalogSysID")
    msg = gs.getMessage(
      "Before closing the call, it is necessary to attach proof of payment."
    );

  if (control && !hasAttachments()) {
    gs.addInfoMessage(msg);
    current.state.setError(msg);
    current.setAbortAction(true);
    current.u_closure_information = "";
    current.state = previous.state;
  }
}

function hasAttachments() {
  var gr = new GlideRecord("sys_attachment");
  gr.addQuery("table_sys_id", current.sys_id);
  gr.query();
  while (gr.next()) {
    return true;
  }
  return false;
}
