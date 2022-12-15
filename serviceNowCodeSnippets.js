/* ServiceNow Code Snippets */

/* Client Scripts */

function onLoad() {
  //Type appropriate comment here, and begin script below
}

function onSubmit() {
  //Type appropriate comment here, and begin script below
}

function onChange(control, oldValue, newValue, isLoading, isTemplate) {
  if (isLoading || newValue === "") {
    return;
  }
  //Type appropriate comment here, and begin script below
}

function onCellEdit(sysIDs, table, oldValues, newValue, callback) {
  //Type appropriate comment here, and begin script below
}

/* g_form */

g_form.getValue("fieldName");
g_form.setValue("fieldName", "value");

g_form.setMandatory("fieldName", true);
g_form.setReadOnly("fieldName", true);
g_form.setVisible("fieldName", true);

g_form.addOption("fieldName", "value");
g_form.removeOption("fieldName", "value");

g_form.addErrorMessage("Message");
g_form.addFormMessage("info message", "info/warning/error");

g_form.showFieldMsg("Message", "error/warn/info");
g_form.hideFieldMsg("fieldName", true);

g_form.clearMessages();
g_form.clearOptions("fieldName");
g_form.clearAllFormMessages();

g_form.clearOptions("fieldName");
g_form.clearValue("fieldName");

g_form.getValue("fieldName");
g_form.getDisplayValue("fieldName");
g_form.getUniqueValue();

g_form.isNewRecord();

/* g_user */

g_user.firstName;
g_user.lastName;
g_user.userID;
g_user.userName;
g_user.getFullName();
g_user.hasRole("role");

/* GlideAjax */

var ga = new GlideAjax("HelloWorld");
ga.addParam("sysparm_name", "helloWorld");
ga.addParam("sysparm_user_name", "Bob");
ga.getXML(HelloWorldParse);

function HelloWorldParse(response) {
  var answer = response.responseXML.documentElement.getAttribute("answer");
  alert(answer);
}

var now_GR = new GlideRecord("incident");

/* GlideRecord */

var gr = new GlideRecord("table");
gr.addQuery("fieldName", "value");
gr.query();

while (gr.next()) {
  return false;
}

/* Logs */

gs.log(
  "logDescription: " +
    JSON.stringify({
      name: value,
      name: value,
      name: value,
      name: value,
    }),
  "logSource"
);

gs.log("Label: " + "value", "logSource");
