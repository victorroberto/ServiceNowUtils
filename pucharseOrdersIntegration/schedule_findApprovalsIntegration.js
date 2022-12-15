/* Declaração de Variáveis */
var listUsers = []; // A lista de usuários que serão buscadas
var listFind = []; // A lista de usuários que serão buscadas neste lote de buscas
var quantidadeBusca = 5; // Quantas chamadas de api serão feitas por vez
var qtdbuscada = 1; // Quantas buscas foram realizadas até o momento
var tempoAteProximaBusca = 60000; // Intervalo de tempo até uma nova busca ocorrer

/* Busca todos os usuários que estão ativos e no grupo 'Aprovadores' */
var approvers = new GlideRecord("sys_user_grmember");
approvers.addEncodedQuery("group.nameSTARTSWITHAPROVADORES^user.active=true");
approvers.query();

/* Adiciona a lista todos os nomes dos usuário que serão usados na busca das aprovações */
while (approvers.next()) {
  listUsers.push(approvers.user.user_name);
}

/* Percorre a lista de usuário recuperados */
for (var i = 0; i <= listUsers.length; i++) {
  var user = listUsers[i];

  /* Esta condição faz a separação dos lotes para o envio */
  if (i == quantidadeBusca * qtdbuscada || i == listUsers.length) {
    buscarAprovacoes(listFind, tempoAteProximaBusca, qtdbuscada);

    qtdbuscada++; // Aumenta o contador de buscas
    listFind = []; // Limpa o lote de envios para ser criado um novo
  }
  listFind.push(user);
}

/* Função para executar a busca das aprovações */
function buscarAprovacoes(users, time) {
  var tempo = gs.nowDateTime(); // Data em que a busca foi feita
  gs.info(tempo);
  gs.sleep(time); // Delay para ser feita a busca

  /* Percorre o lote de usuário passados */
  for (var i = 0; i < users.length; i++) {
    var user = users[i]; // Usuário que esta sendo buscado
    gs.info(user);

    /* Chama o script include SC_OC_GetPendingAproovals para executar o fluxo de busca de aprovações */
    var getAprovacoes = new global.SC_OC_GetPendingAproovals();
    getAprovacoes.getAprovacoes("all", user);
  }
}
