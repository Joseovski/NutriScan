import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { STATUS_LABEL, STATUS_COLOR } from "../services/classificationService";

export default function ResultScreen({ route, navigation }) {
  const { analise, erro, textoBruto } = route.params || {};

  if (erro) {
    return (
      <View style={styles.container}>
        <View style={styles.erroBox}>
          <Text style={styles.erroTitulo}>Não foi possível concluir a análise</Text>
          <Text style={styles.erroTexto}>{erro}</Text>
          {textoBruto ? (
            <Text style={styles.textoBrutoLabel}>
              Texto detectado (para depuração): {"\n"}
              {textoBruto}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Camera")}
        >
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cor = STATUS_COLOR[analise.status];
  const label = STATUS_LABEL[analise.status];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {analise.imagemUri ? (
        <Image source={{ uri: analise.imagemUri }} style={styles.imagem} />
      ) : null}

      <Text style={styles.nomeProduto}>{analise.nomeProduto}</Text>

      <View style={[styles.statusBadge, { backgroundColor: cor }]}>
        <Text style={styles.statusText}>{label}</Text>
      </View>

      <View style={styles.tabela}>
        <LinhaValor label="Calorias" valor={analise.calorias} unidade="kcal" />
        <LinhaValor label="Açúcares" valor={analise.acucares} unidade="g" />
        <LinhaValor label="Sódio" valor={analise.sodio} unidade="mg" />
        <LinhaValor
          label="Gorduras saturadas"
          valor={analise.gordurasSaturadas}
          unidade="g"
        />
      </View>

      <Text style={styles.aviso}>
        Valores de referência por 100g, baseados em diretrizes simplificadas
        de perfil nutricional (OMS/ANVISA). Esta análise não substitui
        orientação nutricional profissional.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Camera")}
      >
        <Text style={styles.buttonText}>Analisar outro produto</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate("Historico")}
      >
        <Text style={styles.linkButtonText}>Ver histórico completo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function LinhaValor({ label, valor, unidade }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={styles.linhaValor}>
        {valor !== null && valor !== undefined ? `${valor} ${unidade}` : "não identificado"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 50, alignItems: "center" },
  imagem: { width: 220, height: 220, borderRadius: 12, marginBottom: 16, backgroundColor: "#eee" },
  nomeProduto: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 12, color: "#222" },
  statusBadge: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginBottom: 20 },
  statusText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  tabela: { width: "100%", backgroundColor: "#F7F7F7", borderRadius: 12, padding: 16, marginBottom: 16 },
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  linhaLabel: { fontSize: 15, color: "#555" },
  linhaValor: { fontSize: 15, fontWeight: "600", color: "#222" },
  aviso: { fontSize: 12, color: "#888", textAlign: "center", marginBottom: 24 },
  button: {
    backgroundColor: "#1F3864",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkButton: { padding: 8 },
  linkButtonText: { color: "#1F3864", fontSize: 15, textDecorationLine: "underline" },
  erroBox: { backgroundColor: "#FDECEA", borderRadius: 12, padding: 20, marginBottom: 20, marginTop: 20 },
  erroTitulo: { fontSize: 17, fontWeight: "700", color: "#C62828", marginBottom: 8 },
  erroTexto: { fontSize: 15, color: "#555" },
  textoBrutoLabel: { fontSize: 11, color: "#999", marginTop: 12 },
});
