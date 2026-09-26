import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { listarAnalises, excluirAnalise } from "../database/db";
import { sincronizarPendentes, baixarAnalisesDoSupabase, estaConectado } from "../services/syncService";
import { STATUS_LABEL, STATUS_COLOR } from "../services/classificationService";
import {supabase} from "../config/supabase";

export default function HistoryScreen({ navigation }) {
  const [analises, setAnalises] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [statusSync, setStatusSync] = useState("");

  const carregarHistorico = useCallback(async () => {
  setCarregando(true);

  try {
    const {
  data: { session },
  error: sessionError,
} = await supabase.auth.getSession();

if (sessionError || !session?.user) {
  throw new Error("Usuário não autenticado.");
}

const user = session.user;

    const online = await estaConectado();

    setStatusSync(
      online
        ? "Conectado"
        : "Offline — sincroniza quando houver conexão"
    );

    if (online) {
      // Primeiro envia o que ainda está pendente no SQLite.
      await sincronizarPendentes();

      // Depois baixa do Supabase o histórico deste usuário.
      await baixarAnalisesDoSupabase(user.id);
    }

    // Por último, lê o histórico atualizado do SQLite.
    const dados = await listarAnalises(user.id);

    setAnalises(dados);
  } catch (err) {
    console.warn(
      "[HistoryScreen] Erro ao carregar histórico:",
      err
    );
  } finally {
    setCarregando(false);
  }
}, []);

  // Recarrega toda vez que a tela ganha foco (ex: após nova análise).
  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
    }, [carregarHistorico])
  );

  function confirmarExclusao(id) {
    Alert.alert("Excluir análise", "Deseja remover este item do histórico?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await excluirAnalise(id);
          carregarHistorico();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Histórico de Análises</Text>
        <Text style={styles.headerSubtitulo}>{statusSync}</Text>
      </View>

      <FlatList
        data={analises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={carregarHistorico} />
        }
        ListEmptyComponent={
          !carregando && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Nenhuma análise ainda. Escaneie um produto para começar.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onLongPress={() => confirmarExclusao(item.id)}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: STATUS_COLOR[item.status] },
              ]}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemNome} numberOfLines={1}>
                {item.nome_produto}
              </Text>
              <Text style={styles.itemData}>
                {new Date(item.criado_em).toLocaleString("pt-BR")}
              </Text>
            </View>
            <View style={styles.itemDireita}>
              <Text style={[styles.itemStatus, { color: STATUS_COLOR[item.status] }]}>
                {STATUS_LABEL[item.status]}
              </Text>
              {item.sincronizado === 0 ? (
                <Text style={styles.pendenteLabel}>não sincronizado</Text>
              ) : (
                <Text style={styles.sincronizadoLabel}>sincronizado</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("Camera")}
      >
        <Text style={styles.fabText}>+ Nova análise</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  headerTitulo: { fontSize: 22, fontWeight: "700", color: "#222" },
  headerSubtitulo: { fontSize: 13, color: "#888", marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: 15, fontWeight: "600", color: "#222" },
  itemData: { fontSize: 12, color: "#888", marginTop: 2 },
  itemDireita: { alignItems: "flex-end" },
  itemStatus: { fontSize: 14, fontWeight: "700" },
  pendenteLabel: { fontSize: 10, color: "#C62828", marginTop: 2 },
  sincronizadoLabel: { fontSize: 10, color: "#2E7D32", marginTop: 2 },
  emptyBox: { padding: 40, alignItems: "center" },
  emptyText: { color: "#999", textAlign: "center", fontSize: 14 },
  fab: {
    position: "absolute",
    bottom: 70,
    alignSelf: "center",
    backgroundColor: "#1F3864",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
