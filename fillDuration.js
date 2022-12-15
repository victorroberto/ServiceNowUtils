/* Business rule to fill 'Duration' field */

(function executeRule(current, previous /*null when async*/) {
  var startDate = new GlideDateTime(current.sys_created_on);
  var endDate = new GlideDateTime(current.u_resolvido_em);
  var schedule = new GlideSchedule();

  schedule.load("38fa64edc0a8016400f4a5724b0434b8"); // loads "24 x 7" schedule
  var duration = schedule.duration(startDate, endDate);

  current.setValue("calendar_duration", duration);
  current.setWorkflow(false);
  current.update();
})(current, previous);
