/**
 * Processa o resultado recebido do leitor
 * de código de barras do expo-camera.
 *
 * A leitura acontece localmente no dispositivo.
 */
export function processBarcode(barcode) {
  if (!barcode || !barcode.data) {
    throw new Error("Nenhum código de barras foi detectado.");
  }

  return {
    codigo: barcode.data.trim(),
    tipo: barcode.type || "desconhecido",
  };
}