import React, { useState } from "react";

import { buscarProduto } from "../services/produtoService";

import { useIsFocused } from "@react-navigation/native";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";

import { SafeAreaView } from "react-native-safe-area-context";

import { processBarcode } from "../services/barcodeService";

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();

  const [processando, setProcessando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState("");
  const [cameraPronta, setCameraPronta] = useState(false);

  const isFocused = useIsFocused();

  // Enquanto verifica a permissão
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Caso ainda não tenha permissão
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionText}>
            Precisamos da sua permissão para usar a câmera e ler o código de
            barras dos produtos.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>
              Permitir acesso à câmera
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function analisarCodigoDeBarras(barcode) {
    if (processando) return;

    try {
      setProcessando(true);
      setMensagemStatus("Lendo código de barras...");

      console.log("[Barcode] Evento recebido:", barcode);

      // Processa o código detectado pela câmera
      const resultadoBarcode = processBarcode(barcode);

      const codigoBarras = resultadoBarcode.codigo;
      const tipoCodigo = resultadoBarcode.tipo;

      console.log("[Barcode] Código:", codigoBarras);
      console.log("[Barcode] Tipo:", tipoCodigo);

      setMensagemStatus("Consultando produto...");

      // =====================================================
      // SQLite → Supabase → Open Food Facts
      // =====================================================

      const resultadoProduto = await buscarProduto(codigoBarras);

      console.log(
        "[CameraScreen] Resultado da busca:",
        resultadoProduto
      );

      // =====================================================
      // PRODUTO ENCONTRADO
      // =====================================================

      if (resultadoProduto.encontrado) {
        console.log("[CameraScreen] Produto encontrado!");

        console.log(
          "[CameraScreen] Origem:",
          resultadoProduto.origem
        );

        setMensagemStatus("Produto encontrado!");

        // Pequeno atraso para mostrar a mensagem
        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        navigation.navigate("Resultado", {
          codigoBarras,
          tipoCodigo,
          produto: resultadoProduto.produto,
          origem: resultadoProduto.origem,
        });

        return;
      }

      // =====================================================
      // PRODUTO NÃO ENCONTRADO
      // =====================================================

      console.log(
        "[CameraScreen] Produto não encontrado."
      );

      setMensagemStatus(
        "Produto não encontrado. Cadastre manualmente."
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      navigation.navigate("CadastroProduto", {
        codigoBarras,
        tipoCodigo,
      });
    } catch (err) {
      console.warn(
        "[CameraScreen] Erro ao processar código:",
        err
      );

      navigation.navigate("Resultado", {
        erro:
          "Ocorreu um erro ao consultar o produto: " +
          err.message,
      });
    } finally {
      setProcessando(false);
      setMensagemStatus("");
    }
  }

  function voltar() {
    if (processando) return;

    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={styles.camera}
          facing="back"
          onCameraReady={() => setCameraPronta(true)}
          onBarcodeScanned={
            processando ? undefined : analisarCodigoDeBarras
          }
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
              "code39",
              "code93",
              "itf14",
            ],
          }}
        />
      )}

      <SafeAreaView
        style={styles.overlay}
        edges={["top", "bottom"]}
      >
        {/* Parte superior */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={voltar}
            disabled={processando}
          >
            <Text style={styles.backButtonText}>
              ← Voltar
            </Text>
          </TouchableOpacity>

          <Text style={styles.instructions}>
            Aponte a câmera para o código de barras
          </Text>
        </View>

        {/* Área de leitura */}
        <View style={styles.scannerArea}>
          <View style={styles.scannerBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <Text style={styles.scannerText}>
            Posicione o código dentro da área
          </Text>
        </View>

        {/* Parte inferior */}
        <View style={styles.bottomBar}>
          {processando ? (
            <View style={styles.processandoBox}>
              <ActivityIndicator
                color="#fff"
                size="large"
              />

              <Text style={styles.processandoText}>
                {mensagemStatus}
              </Text>
            </View>
          ) : (
            <View style={styles.readyBox}>
              <Text style={styles.readyText}>
                Pronto para escanear
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.historyLink}
            onPress={() =>
              navigation.navigate("Historico")
            }
            disabled={processando}
          >
            <Text style={styles.historyLinkText}>
              Ver histórico
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  camera: {
    ...StyleSheet.absoluteFill,
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },

  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: "center",
  },

  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },

  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  instructions: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  scannerArea: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  scannerBox: {
    width: 280,
    height: 150,
    position: "relative",
  },

  corner: {
    position: "absolute",
    width: 35,
    height: 35,
    borderColor: "#fff",
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },

  scannerText: {
    color: "#fff",
    marginTop: 20,
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  bottomBar: {
    alignItems: "center",
    paddingBottom: 10,
  },

  processandoBox: {
    alignItems: "center",
    marginBottom: 16,
  },

  processandoText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 14,
  },

  readyBox: {
    marginBottom: 16,
  },

  readyText: {
    color: "#fff",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  historyLink: {
    padding: 8,
  },

  historyLinkText: {
    color: "#fff",
    fontSize: 15,
    textDecorationLine: "underline",
  },

  permissionBox: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },

  button: {
    backgroundColor: "#1F3864",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});