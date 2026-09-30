import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppNavigator from "./src/navigation/AppNavigator";
import { initDatabase } from "./src/database/db";

export default function App() {
  const [bancoPronto, setBancoPronto] = useState(false);
  const [erroInicializacao, setErroInicializacao] = useState(null);

  useEffect(() => {
    async function iniciarBanco() {
      try {
        await initDatabase();

        console.log("[SQLite] Banco inicializado com sucesso.");

        setBancoPronto(true);
      } catch (error) {
        console.error("[SQLite] Erro ao inicializar banco:", error);
        setErroInicializacao(error?.message || String(error));
      }
    }

    iniciarBanco();
  }, []);

  if (erroInicializacao) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <Text style={styles.titulo}>
            Erro ao iniciar o aplicativo
          </Text>

          <Text style={styles.erro}>
            {erroInicializacao}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!bancoPronto) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <Text style={styles.carregando}>
            Iniciando NutriScan...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F7F8FA",
  },

  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F3864",
    textAlign: "center",
    marginBottom: 12,
  },

  carregando: {
    fontSize: 18,
    color: "#1F3864",
    fontWeight: "600",
  },

  erro: {
    fontSize: 14,
    color: "#C62828",
    textAlign: "center",
  },
});