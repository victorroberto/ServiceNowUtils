/* Client Script to validate CNPJ */
function onChange(control, oldValue, newValue, isLoading) {
  if (isLoading || newValue == "") {
    return;
  }

  var regEx = /^[0-9]*$/;

  if (!regEx.test(newValue)) {
    alert(
      "Por favor, digite apenas números no campo '" +
        g_form.getLabelOf("cnpj_do_cliente") +
        "'."
    );
    g_form.clearValue("cnpj_do_cliente");
  } else if (newValue.length != 14) {
    alert(
      "Por favor, insira um CNPJ válido. Um CNPJ válido deve ter 14 dígitos, mas você inseriu " +
        newValue.length +
        " dígitos."
    );
    g_form.clearValue("cnpj_do_cliente");
  }
}
