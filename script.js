/* MM&B Cutelaria — consulta de certificado
   Lê o parâmetro ?id= da URL, busca na API do Google Apps Script e mostra o resultado. */

/* ====== AJUSTE AQUI ====== */
const CONFIG = {
  // Cole o link /exec que o Apps Script gerou ao publicar como Aplicativo da Web
  API: 'https://script.google.com/macros/s/COLE_SEU_ID_AQUI/exec',

  // WhatsApp da oficina, só números, com DDI e DDD
  WHATSAPP: '5551999211038',

  // Esconde o sobrenome do cliente na página pública (a página é aberta por qualquer um)
  OCULTAR_SOBRENOME: true
};
/* ========================= */

const app = document.getElementById('app');

function mostrar(nome) {
  app.querySelectorAll('.estado').forEach(function (sec) {
    sec.hidden = sec.dataset.estado !== nome;
  });
}

function lerId() {
  const p = new URLSearchParams(location.search);
  const bruto = p.get('id') || p.get('c') || p.get('cert') || '';
  return bruto.trim().toUpperCase();
}

function linkWhats(texto) {
  return 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(texto);
}

function primeiroNome(nome) {
  if (!nome) return '';
  if (!CONFIG.OCULTAR_SOBRENOME) return nome;
  const partes = String(nome).trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  return partes[0] + ' ' + partes[partes.length - 1].charAt(0).toUpperCase() + '.';
}

function classeDoStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s.indexOf('ativ') === 0 || s.indexOf('vigente') === 0 || s.indexOf('válid') === 0) return 'ok';
  if (s.indexOf('cancel') === 0 || s.indexOf('roub') === 0 || s.indexOf('perd') === 0) return 'alerta';
  return 'atencao';
}

function fraseDoStatus(status) {
  const c = classeDoStatus(status);
  if (c === 'ok') return 'Peça autêntica, garantia ativa';
  if (c === 'alerta') return 'Registro bloqueado — fale com a oficina';
  return 'Peça autêntica, garantia ' + String(status || '').toLowerCase();
}

/* Campos que a ficha mostra, na ordem. A chave é o nome da coluna da planilha em minúsculas. */
const CAMPOS = [
  { chave: 'produto', rotulo: 'Modelo' },
  { chave: 'aco', rotulo: 'Aço da lâmina' },
  { chave: 'cabo', rotulo: 'Cabo' },
  { chave: 'cliente', rotulo: 'Primeiro dono', tratar: primeiroNome },
  { chave: 'data', rotulo: 'Forjada em' },
  { chave: 'status', rotulo: 'Situação' }
];

function montarFicha(dados) {
  const dl = document.getElementById('c-ficha');
  dl.innerHTML = '';
  CAMPOS.forEach(function (campo) {
    let valor = dados[campo.chave];
    if (valor === undefined || valor === null || String(valor).trim() === '') return;
    if (campo.tratar) valor = campo.tratar(valor);
    const linha = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = campo.rotulo;
    const dd = document.createElement('dd');
    dd.textContent = valor;
    linha.appendChild(dt);
    linha.appendChild(dd);
    dl.appendChild(linha);
  });
}

function renderOk(dados) {
  const id = dados.certificado || lerId();
  document.getElementById('c-id').textContent = id;
  document.getElementById('c-status-texto').textContent = fraseDoStatus(dados.status);

  const ponto = document.getElementById('c-ponto');
  ponto.className = 'ponto';
  const c = classeDoStatus(dados.status);
  if (c === 'alerta') ponto.classList.add('ponto--alerta');
  if (c === 'atencao') ponto.classList.add('ponto--atencao');

  montarFicha(dados);

  document.getElementById('c-contato').href = linkWhats(
    'Olá! Estou com a faca de certificado ' + id + ' e gostaria de falar sobre ela.'
  );

  document.title = 'Certificado ' + id + ' — MM&B Cutelaria';
  mostrar('ok');
}

function renderNaoEncontrado(id) {
  document.getElementById('e-id').textContent = id || 'MB-____';
  document.getElementById('e-contato').href = linkWhats(
    'Olá! Consultei o código ' + id + ' no site e não apareceu nenhum certificado. Podem conferir?'
  );
  mostrar('nao-encontrado');
}

function buscar(id) {
  mostrar('carregando');

  fetch(CONFIG.API + '?id=' + encodeURIComponent(id), { method: 'GET' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (resp) {
      if (resp && resp.ok && resp.dados) renderOk(resp.dados);
      else renderNaoEncontrado(id);
    })
    .catch(function (err) {
      console.error('Falha na consulta:', err);
      mostrar('erro');
    });
}

function iniciarBuscaManual() {
  const campo = document.getElementById('campo-id');
  const botao = document.getElementById('btn-buscar');

  function ir() {
    const v = campo.value.trim().toUpperCase();
    if (!v) { campo.focus(); return; }
    location.search = '?id=' + encodeURIComponent(v);
  }

  botao.addEventListener('click', ir);
  campo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') ir();
  });
}

/* início */
(function () {
  const id = lerId();
  iniciarBuscaManual();
  if (!id) { mostrar('sem-codigo'); return; }
  buscar(id);
})();
