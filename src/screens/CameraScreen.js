import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { extractTextFromImage } from "../services/ocrService";
import { parseNutritionalInfo, guessProductName } from "../services/parserService";
import { classifyProduct } from "../services/classificationService";
import { inserirAnalise } from "../database/db";
import { sincronizarPendentes } from "../services/syncService";
import { gerarUUID } from "../utils/uuid";
import { supabase } from "../config/supabase";

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [processando, setProcessando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState("");
  const [cameraPronta, setCameraPronta] = useState(false);
  const cameraRef = useRef(null);


  // Enquanto a permissão de câmera ainda está sendo verificada.
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Usuário ainda não concedeu (ou negou) a permissão de câmera.
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionText}>
            Precisamos da sua permissão para usar a câmera e ler as tabelas
            nutricionais.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Permitir acesso à câmera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function capturarEAnalisar() {
    if (!cameraRef.current || processando) return;

    try {
      setProcessando(true);
      setMensagemStatus("Capturando foto...");

      const foto = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      setMensagemStatus("Lendo o texto do rótulo (OCR)...");
      const textoBruto = await extractTextFromImage(foto.uri);

      if (!textoBruto) {
        setMensagemStatus("");
        setProcessando(false);
        navigation.navigate("Resultado", {
          erro:
            "Não conseguimos identificar texto na imagem. Tente aproximar mais da tabela nutricional e evitar reflexos.",
        });
        return;
      }

      setMensagemStatus("Extraindo valores nutricionais...");
      const valores = parseNutritionalInfo(textoBruto);
      const nomeProduto = guessProductName(textoBruto);

      setMensagemStatus("Classificando produto...");
      const status = classifyProduct(valores);

      if (!status) {
        setMensagemStatus("");
        setProcessando(false);
        navigation.navigate("Resultado", {
          erro:
            "Não conseguimos identificar valores nutricionais suficientes nesta imagem. Tente novamente com uma foto mais nítida da tabela.",
          textoBruto,
        });
        return;
      }

      const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
  throw new Error("Não foi possível identificar o usuário logado.");
}

const analise = {
  id: gerarUUID(),
  userId: user.id,
  nomeProduto,
  calorias: valores.calorias,
  acucares: valores.acucares,
  sodio: valores.sodio,
  gordurasSaturadas: valores.gordurasSaturadas,
  status,
  textoBrutoOcr: textoBruto,
  imagemUri: foto.uri,
  criadoEm: new Date().toISOString(),
};

      setMensagemStatus("Salvando análise...");
      await inserirAnalise(analise);

      // Tenta sincronizar em segundo plano; não bloqueia a navegação
      // caso não haja internet no momento (arquitetura offline-first).
      sincronizarPendentes().catch(() => {});

      setProcessando(false);
      setMensagemStatus("");
      navigation.navigate("Resultado", { analise });
    } catch (err) {
      console.warn("[CameraScreen] Erro ao processar imagem:", err);
      setProcessando(false);
      setMensagemStatus("");
      navigation.navigate("Resultado", {
        erro: `Ocorreu um erro ao processar a imagem: ${err.message}`,
      });
    }
  }

  return (
  <View style={styles.container}>
    <CameraView
  ref={cameraRef}
  style={styles.camera}
  facing="back"

  onCameraReady={() => {
    console.log("[Camera] Preview pronta");
    setCameraPronta(true);
  }}
  onMountError={(error) => {
    console.error("[Camera] Erro ao iniciar:", error);
    setCameraPronta(false);
  }}
/>

    <SafeAreaView style={styles.overlay}>
      <View style={styles.topBar}>
        <Text style={styles.instructions}>
          Aponte a câmera para a tabela nutricional
        </Text>
      </View>


      <View style={styles.bottomBar}>
        {processando ? (
          <View style={styles.processandoBox}>
            <ActivityIndicator color="#fff" size="large" />

            <Text style={styles.processandoText}>
              {mensagemStatus}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={capturarEAnalisar}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => navigation.navigate("Historico")}
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
    padding: 20,
    alignItems: "center",
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

  

  bottomBar: {
    alignItems: "center",
    paddingBottom: 30,
  },

  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
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