import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  Platform,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import { useFocusEffect } from "@react-navigation/native";

import {
  listarAnalises,
  excluirAnalise,
  registrarExclusaoPendente,
} from "../database/db";

import {
  estaConectado,
  sincronizarPendentes,
  baixarAnalisesDoSupabase,
} from "../services/syncService";

import {
  STATUS_LABEL,
  STATUS_COLOR,
} from "../services/classificationService";

import { supabase } from "../config/supabase";

export default function HistoryScreen({ navigation }) {
  const [analises, setAnalises] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [statusSync, setStatusSync] = useState("");

  // =========================================================
  // FILTRO
  // =========================================================

  const [filtroData, setFiltroData] = useState("todos");

  const [dataSelecionada, setDataSelecionada] =
    useState(null);

  const [mostrarDatePicker, setMostrarDatePicker] =
    useState(false);

  // =========================================================
  // CARREGAR HISTÓRICO
  // =========================================================

  const carregarHistorico = useCallback(async () => {
    setCarregando(true);

    try {
      // -------------------------------------------------------
      // VERIFICA USUÁRIO
      // -------------------------------------------------------

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        throw new Error(
          "Usuário não autenticado."
        );
      }

      const user = session.user;

      // -------------------------------------------------------
      // VERIFICA INTERNET
      // -------------------------------------------------------

      const online = await estaConectado();

      setStatusSync(
        online
          ? "Conectado"
          : "Offline — sincroniza quando houver conexão"
      );

      // -------------------------------------------------------
      // SINCRONIZAÇÃO
      // -------------------------------------------------------

      if (online) {
        try {
          /*
           * Primeiro envia alterações/exclusões
           * locais para o Supabase.
           */
          await sincronizarPendentes();

          /*
           * Depois baixa o histórico atualizado.
           */
          await baixarAnalisesDoSupabase(
            user.id
          );
        } catch (syncError) {
          console.warn(
            "[HistoryScreen] Erro na sincronização:",
            syncError
          );
        }
      }

      // -------------------------------------------------------
      // CARREGA SQLITE
      // -------------------------------------------------------

      const dados = await listarAnalises(
        user.id
      );

      setAnalises(dados);

    } catch (err) {
      console.warn(
        "[HistoryScreen] Erro ao carregar histórico:",
        err
      );

      Alert.alert(
        "Erro",
        "Não foi possível carregar o histórico."
      );

    } finally {
      setCarregando(false);
    }
  }, []);

  // =========================================================
  // RECARREGAR AO ENTRAR NA TELA
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
    }, [carregarHistorico])
  );

  // =========================================================
  // FUNÇÕES DE DATA
  // =========================================================

  function normalizarData(data) {
    const novaData = new Date(data);

    novaData.setHours(
      0,
      0,
      0,
      0
    );

    return novaData;
  }

  function obterChaveData(data) {
    const dataNormalizada =
      normalizarData(data);

    if (
      isNaN(dataNormalizada.getTime())
    ) {
      return null;
    }

    const ano =
      dataNormalizada.getFullYear();

    const mes = String(
      dataNormalizada.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      dataNormalizada.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function formatarData(dataString) {
    const data = new Date(dataString);

    if (isNaN(data.getTime())) {
      return "Data desconhecida";
    }

    return data.toLocaleDateString(
      "pt-BR"
    );
  }

  function formatarHora(dataString) {
    const data = new Date(dataString);

    if (isNaN(data.getTime())) {
      return "";
    }

    return data.toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function obterHoje() {
    return obterChaveData(
      new Date()
    );
  }

  function obterOntem() {
    const data = new Date();

    data.setDate(
      data.getDate() - 1
    );

    return obterChaveData(data);
  }

  // =========================================================
  // ABRIR SELETOR DE DATA
  // =========================================================

  function abrirSeletorData() {
    setMostrarDatePicker(true);
  }

  function aoSelecionarData(
    event,
    data
  ) {
    setMostrarDatePicker(false);

    if (
      event.type === "dismissed" ||
      !data
    ) {
      return;
    }

    setDataSelecionada(data);

    setFiltroData(
      obterChaveData(data)
    );
  }

  // =========================================================
  // FILTRAR HISTÓRICO
  // =========================================================

  const analisesFiltradas =
    useMemo(() => {
      if (filtroData === "todos") {
        return analises;
      }

      if (filtroData === "hoje") {
        const hoje = obterHoje();

        return analises.filter(
          (item) =>
            obterChaveData(
              item.criado_em
            ) === hoje
        );
      }

      if (filtroData === "ontem") {
        const ontem = obterOntem();

        return analises.filter(
          (item) =>
            obterChaveData(
              item.criado_em
            ) === ontem
        );
      }

      return analises.filter(
        (item) =>
          obterChaveData(
            item.criado_em
          ) === filtroData
      );
    }, [
      analises,
      filtroData,
    ]);

  // =========================================================
  // EXCLUIR ANÁLISE
  // =========================================================

  async function executarExclusao(id) {
    try {
      setCarregando(true);

      console.log(
        "[Historico] Excluindo análise:",
        id
      );

      // -------------------------------------------------------
      // 1. REGISTRA A EXCLUSÃO
      // -------------------------------------------------------

      await registrarExclusaoPendente(id);

      // -------------------------------------------------------
      // 2. REMOVE IMEDIATAMENTE DO SQLITE
      // -------------------------------------------------------

      await excluirAnalise(id);

      // -------------------------------------------------------
      // 3. TENTA SINCRONIZAR COM SUPABASE
      // -------------------------------------------------------

      try {
        await sincronizarPendentes();
      } catch (syncError) {
        console.warn(
          "[Historico] Erro ao sincronizar exclusão:",
          syncError
        );
      }

      // -------------------------------------------------------
      // 4. CARREGA NOVAMENTE O HISTÓRICO
      // -------------------------------------------------------

      await carregarHistorico();

    } catch (error) {
      console.warn(
        "[Historico] Erro ao excluir análise:",
        error
      );

      Alert.alert(
        "Erro",
        "Não foi possível excluir a análise."
      );

    } finally {
      setCarregando(false);
    }
  }

  // =========================================================
  // CONFIRMAR EXCLUSÃO
  // =========================================================

  function confirmarExclusao(id) {
    Alert.alert(
      "Excluir análise",
      "Tem certeza que deseja excluir esta análise?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () =>
            executarExclusao(id),
        },
      ]
    );
  }

  // =========================================================
  // REVER ANÁLISE
  // =========================================================

  function reverAnalise(item) {
    const produto = {
      id: item.id,

      codigo_barras:
        item.codigo_barras || null,

      nome_produto:
        item.nome_produto ||
        "Produto sem nome",

      calorias:
        item.calorias ?? null,

      acucares:
        item.acucares ?? null,

      sodio:
        item.sodio ?? null,

      gorduras_saturadas:
        item.gorduras_saturadas ??
        null,
    };

    navigation.navigate(
      "Resultado",
      {
        codigoBarras:
          item.codigo_barras,

        tipoCodigo:
          "desconhecido",

        produto,

        origem:
          "historico",

        somenteVisualizacao:
          true,

        analiseId:
          item.id,
      }
    );
  }

  // =========================================================
  // STATUS
  // =========================================================

  function obterStatusColor(
    status
  ) {
    return (
      STATUS_COLOR[status] ||
      "#777"
    );
  }

  function obterStatusLabel(
    status
  ) {
    return (
      STATUS_LABEL[status] ||
      "Sem classificação"
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <View style={styles.container}>

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <View style={styles.header}>

        <Text style={styles.headerTitulo}>
          Histórico de análises
        </Text>

        <Text style={styles.headerSubtitulo}>
          {analises.length === 0
            ? "Nenhuma análise realizada"
            : `${analises.length} ${
                analises.length === 1
                  ? "análise registrada"
                  : "análises registradas"
              }`}
        </Text>

        <Text style={styles.syncStatus}>
          {statusSync}
        </Text>

      </View>

      {/* =====================================================
          FILTRO
      ===================================================== */}

      <View
        style={styles.filtroContainer}
      >

        <Text style={styles.filtroTitulo}>
          Filtrar por data
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filtrosScroll
          }
        >

          {/* TODOS */}

          <TouchableOpacity
            style={[
              styles.filtroBotao,
              filtroData === "todos" &&
                styles.filtroBotaoAtivo,
            ]}
            onPress={() => {
              setFiltroData(
                "todos"
              );

              setDataSelecionada(
                null
              );
            }}
          >
            <Text
              style={[
                styles.filtroTexto,
                filtroData ===
                  "todos" &&
                  styles.filtroTextoAtivo,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {/* HOJE */}

          <TouchableOpacity
            style={[
              styles.filtroBotao,
              filtroData === "hoje" &&
                styles.filtroBotaoAtivo,
            ]}
            onPress={() => {
              setFiltroData(
                "hoje"
              );

              setDataSelecionada(
                null
              );
            }}
          >
            <Text
              style={[
                styles.filtroTexto,
                filtroData ===
                  "hoje" &&
                  styles.filtroTextoAtivo,
              ]}
            >
              Hoje
            </Text>
          </TouchableOpacity>

          {/* ONTEM */}

          <TouchableOpacity
            style={[
              styles.filtroBotao,
              filtroData === "ontem" &&
                styles.filtroBotaoAtivo,
            ]}
            onPress={() => {
              setFiltroData(
                "ontem"
              );

              setDataSelecionada(
                null
              );
            }}
          >
            <Text
              style={[
                styles.filtroTexto,
                filtroData ===
                  "ontem" &&
                  styles.filtroTextoAtivo,
              ]}
            >
              Ontem
            </Text>
          </TouchableOpacity>

          {/* ESCOLHER DATA */}

          <TouchableOpacity
            style={[
              styles.filtroBotao,

              dataSelecionada &&
                filtroData !== "hoje" &&
                filtroData !== "ontem" &&
                filtroData !== "todos" &&
                styles.filtroBotaoAtivo,
            ]}
            onPress={
              abrirSeletorData
            }
          >
            <Text
              style={[
                styles.filtroTexto,

                dataSelecionada &&
                  filtroData !== "hoje" &&
                  filtroData !== "ontem" &&
                  filtroData !== "todos" &&
                  styles.filtroTextoAtivo,
              ]}
            >
              Escolher data
            </Text>
          </TouchableOpacity>

        </ScrollView>

        {/* DATA SELECIONADA */}

        {dataSelecionada && (
          <View
            style={
              styles.dataSelecionadaBox
            }
          >

            <Text
              style={
                styles.dataSelecionadaTexto
              }
            >
              Data selecionada:{" "}

              <Text
                style={
                  styles.dataSelecionadaValor
                }
              >
                {dataSelecionada.toLocaleDateString(
                  "pt-BR"
                )}
              </Text>

            </Text>

            <TouchableOpacity
              onPress={() => {
                setDataSelecionada(
                  null
                );

                setFiltroData(
                  "todos"
                );
              }}
            >
              <Text
                style={
                  styles.limparFiltro
                }
              >
                Limpar
              </Text>
            </TouchableOpacity>

          </View>
        )}

      </View>

      {/* =====================================================
          DATE PICKER
      ===================================================== */}

      {mostrarDatePicker && (
        <DateTimePicker
          value={
            dataSelecionada ||
            new Date()
          }
          mode="date"
          display={
            Platform.OS === "ios"
              ? "spinner"
              : "default"
          }
          maximumDate={
            new Date()
          }
          onChange={
            aoSelecionarData
          }
        />
      )}

      {/* =====================================================
          LISTA
      ===================================================== */}

      <FlatList
        data={analisesFiltradas}

        keyExtractor={(item) =>
          String(item.id)
        }

        contentContainerStyle={
          analisesFiltradas.length === 0
            ? styles.listaVazia
            : styles.listContent
        }

        refreshControl={
          <RefreshControl
            refreshing={
              carregando
            }
            onRefresh={
              carregarHistorico
            }
          />
        }

        ListEmptyComponent={
          !carregando && (
            <View
              style={styles.emptyBox}
            >

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Nenhuma análise encontrada
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                {filtroData ===
                "todos"
                  ? "Escaneie um produto para começar seu histórico."
                  : "Não existem análises registradas nesta data."}
              </Text>

              <TouchableOpacity
                style={
                  styles.novaAnaliseButton
                }
                onPress={() =>
                  navigation.navigate(
                    "Camera"
                  )
                }
              >
                <Text
                  style={
                    styles.novaAnaliseButtonText
                  }
                >
                  Fazer nova análise
                </Text>
              </TouchableOpacity>

            </View>
          )
        }

        renderItem={({ item }) => {

          const statusColor =
            obterStatusColor(
              item.status
            );

          const statusLabel =
            obterStatusLabel(
              item.status
            );

          return (
            <View
              style={styles.item}
            >

              {/* INFORMAÇÕES */}

              <View
                style={
                  styles.itemTopo
                }
              >

                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor:
                        statusColor,
                    },
                  ]}
                />

                <View
                  style={
                    styles.itemInfo
                  }
                >

                  <Text
                    style={
                      styles.itemNome
                    }
                    numberOfLines={2}
                  >
                    {item.nome_produto ||
                      "Produto sem nome"}
                  </Text>

                  <Text
                    style={
                      styles.itemData
                    }
                  >
                    {formatarData(
                      item.criado_em
                    )}
                  </Text>

                  <Text
                    style={
                      styles.itemHora
                    }
                  >
                    {formatarHora(
                      item.criado_em
                    )}
                  </Text>

                </View>

                <View
                  style={
                    styles.statusBox
                  }
                >

                  <Text
                    style={[
                      styles.itemStatus,
                      {
                        color:
                          statusColor,
                      },
                    ]}
                  >
                    {statusLabel}
                  </Text>

                </View>

              </View>

              {/* CÓDIGO */}

              {item.codigo_barras ? (
                <View
                  style={
                    styles.codigoBox
                  }
                >

                  <Text
                    style={
                      styles.codigoLabel
                    }
                  >
                    Código:
                  </Text>

                  <Text
                    style={
                      styles.codigoValor
                    }
                  >
                    {item.codigo_barras}
                  </Text>

                </View>
              ) : null}

              {/* SINCRONIZAÇÃO */}

              <View
                style={
                  styles.syncBox
                }
              >

                {item.sincronizado ===
                0 ? (
                  <Text
                    style={
                      styles.pendenteLabel
                    }
                  >
                    Salvo no dispositivo
                  </Text>
                ) : (
                  <Text
                    style={
                      styles.sincronizadoLabel
                    }
                  >
                    Sincronizado
                  </Text>
                )}

              </View>

              {/* BOTÕES */}

              <View
                style={styles.acoes}
              >

                <TouchableOpacity
                  style={
                    styles.botaoRever
                  }
                  onPress={() =>
                    reverAnalise(
                      item
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      styles.botaoReverTexto
                    }
                  >
                    REVER
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.botaoExcluir
                  }
                  onPress={() =>
                    confirmarExclusao(
                      item.id
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      styles.botaoExcluirTexto
                    }
                  >
                    EXCLUIR
                  </Text>
                </TouchableOpacity>

              </View>

            </View>
          );
        }}
      />

      {/* =====================================================
          NOVA ANÁLISE
      ===================================================== */}

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate(
            "Camera"
          )
        }
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>
          NOVA ANÁLISE
        </Text>
      </TouchableOpacity>

    </View>
  );
}

// ===========================================================
// ESTILOS
// ===========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },

  // =========================================================
  // HEADER
  // =========================================================

  header: {
    backgroundColor: "#1F3864",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },

  headerTitulo: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },

  headerSubtitulo: {
    color: "#DCE5F5",
    fontSize: 14,
    marginTop: 5,
  },

  syncStatus: {
    color: "#fff",
    fontSize: 12,
    marginTop: 8,
    opacity: 0.9,
  },

  // =========================================================
  // FILTRO
  // =========================================================

  filtroContainer: {
    backgroundColor: "#fff",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },

  filtroTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    paddingHorizontal: 16,
    marginBottom: 9,
  },

  filtrosScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },

  filtroBotao: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8C8C8",
    backgroundColor: "#fff",
  },

  filtroBotaoAtivo: {
    backgroundColor: "#1F3864",
    borderColor: "#1F3864",
  },

  filtroTexto: {
    color: "#444",
    fontSize: 13,
    fontWeight: "600",
  },

  filtroTextoAtivo: {
    color: "#fff",
  },

  dataSelecionadaBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#EEF2F8",
    borderRadius: 8,
  },

  dataSelecionadaTexto: {
    color: "#555",
    fontSize: 13,
  },

  dataSelecionadaValor: {
    color: "#1F3864",
    fontWeight: "800",
  },

  limparFiltro: {
    color: "#C62828",
    fontWeight: "700",
    fontSize: 13,
  },

  // =========================================================
  // LISTA
  // =========================================================

  listContent: {
    padding: 14,
    paddingBottom: 100,
  },

  listaVazia: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 120,
  },

  // =========================================================
  // ITEM
  // =========================================================

  item: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 14,
    padding: 15,

    elevation: 2,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  itemTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  statusIndicator: {
    width: 8,
    height: 55,
    borderRadius: 4,
    marginRight: 12,
  },

  itemInfo: {
    flex: 1,
    paddingRight: 8,
  },

  itemNome: {
    color: "#222",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 7,
  },

  itemData: {
    color: "#555",
    fontSize: 13,
    marginBottom: 3,
  },

  itemHora: {
    color: "#777",
    fontSize: 13,
  },

  statusBox: {
    alignItems: "flex-end",
  },

  itemStatus: {
    fontSize: 13,
    fontWeight: "800",
  },

  // =========================================================
  // CÓDIGO
  // =========================================================

  codigoBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  codigoLabel: {
    fontSize: 12,
    color: "#888",
    marginRight: 5,
  },

  codigoValor: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },

  // =========================================================
  // SINCRONIZAÇÃO
  // =========================================================

  syncBox: {
    marginTop: 8,
  },

  pendenteLabel: {
    color: "#A66A00",
    fontSize: 12,
    fontWeight: "600",
  },

  sincronizadoLabel: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
  },

  // =========================================================
  // AÇÕES
  // =========================================================

  acoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  botaoRever: {
    flex: 1,
    minHeight: 48,
    backgroundColor: "#1F3864",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  botaoReverTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  botaoExcluir: {
    flex: 1,
    minHeight: 48,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#D32F2F",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  botaoExcluirTexto: {
    color: "#C62828",
    fontSize: 14,
    fontWeight: "800",
  },

  // =========================================================
  // VAZIO
  // =========================================================

  emptyBox: {
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },

  novaAnaliseButton: {
    marginTop: 20,
    backgroundColor: "#1F3864",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 10,
  },

  novaAnaliseButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  // =========================================================
  // NOVA ANÁLISE
  // =========================================================

  fab: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    height: 58,
    backgroundColor: "#1F3864",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",

    elevation: 6,

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  fabText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});