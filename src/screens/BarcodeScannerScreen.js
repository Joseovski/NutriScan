import { useState } from "react";

import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";

import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";

import { processBarcode } from "../services/barcodeService";

export default function BarcodeScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [codigo, setCodigo] = useState(null);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Verificando permissão da câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          O aplicativo precisa acessar a câmera
          para ler o código de barras.
        </Text>

        <Pressable
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>
            Permitir câmera
          </Text>
        </Pressable>
      </View>
    );
  }

  function handleBarcodeScanned(result) {
    if (scanned) {
      return;
    }

    setScanned(true);

    try {
      const resultado = processBarcode(result);

      console.log("Código:", resultado.codigo);
      console.log("Tipo:", resultado.tipo);

      setCodigo(resultado);
    } catch (error) {
      console.error(
        "Erro ao processar código:",
        error
      );
    }
  }

  function escanearNovamente() {
    setCodigo(null);
    setScanned(false);
  }

  return (
    <View style={styles.container}>

      {!codigo ? (
        <>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={
              scanned
                ? undefined
                : handleBarcodeScanned
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

          <View style={styles.overlay}>
            <View style={styles.scanBox} />

            <Text style={styles.instructions}>
              Aponte a câmera para o código de barras
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.resultContainer}>

          <Text style={styles.title}>
            Código encontrado
          </Text>

          <Text style={styles.codigo}>
            {codigo.codigo}
          </Text>

          <Text style={styles.tipo}>
            Tipo: {codigo.tipo}
          </Text>

          <Pressable
            style={styles.button}
            onPress={escanearNovamente}
          >
            <Text style={styles.buttonText}>
              Escanear novamente
            </Text>
          </Pressable>

        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  camera: {
    flex: 1,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    justifyContent: "center",
    alignItems: "center",
  },

  scanBox: {
    width: 300,
    height: 150,

    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 12,
  },

  instructions: {
    marginTop: 25,

    color: "#fff",
    fontSize: 16,
    textAlign: "center",

    paddingHorizontal: 30,
  },

  center: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",

    padding: 20,
  },

  permissionText: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
  },

  resultContainer: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",

    padding: 20,

    backgroundColor: "#fff",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",

    marginBottom: 20,
  },

  codigo: {
    fontSize: 28,
    fontWeight: "bold",

    marginBottom: 10,
  },

  tipo: {
    fontSize: 16,

    marginBottom: 30,
  },

  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,

    borderRadius: 8,

    backgroundColor: "#222",
  },

  buttonText: {
    color: "#fff",

    fontSize: 16,
    fontWeight: "bold",
  },
});