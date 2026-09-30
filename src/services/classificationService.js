// Serviço responsável pela ETAPA 5 (Reconhecimento de Padrões) do pipeline:
// aplica regras de negócio simples (baseadas em referências de perfil
// nutricional OMS/ANVISA) para classificar o produto.
//
// Os limites abaixo são valores de referência POR 100g e podem/devem ser
// ajustados pelo grupo conforme a bibliografia usada no trabalho.

export const STATUS = {
  SAUDAVEL: "saudavel",
  MODERADO: "moderado",
  EVITAR: "evitar",
};

export const STATUS_LABEL = {
  [STATUS.SAUDAVEL]: "Saudável",
  [STATUS.MODERADO]: "Moderado",
  [STATUS.EVITAR]: "Evitar",
};

export const STATUS_COLOR = {
  [STATUS.SAUDAVEL]: "#2E7D32", // verde
  [STATUS.MODERADO]: "#F9A825", // amarelo
  [STATUS.EVITAR]: "#C62828", // vermelho
};

const LIMITES = {
  acucares: { saudavel: 5, moderado: 15 }, // gramas por 100g
  sodio: { saudavel: 120, moderado: 400 }, // miligramas por 100g
  gordurasSaturadas: { saudavel: 1.5, moderado: 5 }, // gramas por 100g
};

function classificarNutriente(valor, limites) {
  if (valor === null || valor === undefined) return null; // sem dado suficiente
  if (valor <= limites.saudavel) return STATUS.SAUDAVEL;
  if (valor <= limites.moderado) return STATUS.MODERADO;
  return STATUS.EVITAR;
}

/**
 * Classifica o produto em SAUDÁVEL / MODERADO / EVITAR com base nos
 * valores nutricionais extraídos.
 *
 * Regra de decisão:
 *  - Se qualquer nutriente cair em "evitar" -> produto é "evitar"
 *  - Senão, se qualquer nutriente cair em "moderado" -> produto é "moderado"
 *  - Se todos os nutrientes disponíveis forem "saudável" -> produto é "saudável"
 *  - Se nenhum nutriente foi identificado -> retorna null (indeterminado)
 *
 * @param {{acucares:number|null, sodio:number|null, gordurasSaturadas:number|null}} valores
 * @returns {string|null} um dos valores de STATUS, ou null se não foi possível classificar
 */
export function classifyProduct(valores) {
  const classificacoes = [
    classificarNutriente(valores.acucares, LIMITES.acucares),
    classificarNutriente(valores.sodio, LIMITES.sodio),
    classificarNutriente(valores.gordurasSaturadas, LIMITES.gordurasSaturadas),
  ].filter((c) => c !== null);

  if (classificacoes.length === 0) return null;

  if (classificacoes.includes(STATUS.EVITAR)) return STATUS.EVITAR;
  if (classificacoes.includes(STATUS.MODERADO)) return STATUS.MODERADO;
  return STATUS.SAUDAVEL;
}

export function analisarNutrientes(valores) {
  return {
    acucares: classificarNutriente(
      valores.acucares,
      LIMITES.acucares
    ),

    sodio: classificarNutriente(
      valores.sodio,
      LIMITES.sodio
    ),

    gordurasSaturadas: classificarNutriente(
      valores.gordurasSaturadas,
      LIMITES.gordurasSaturadas
    ),
  };
}
