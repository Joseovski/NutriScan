import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  inserirProduto,
  atualizarProduto,
} from "../database/db";

import { supabase } from "../config/supabase";

export default function CadastroProdutoScreen({ navigation, route }) {
  const {
    codigoBarras = "",
    tipoCodigo = "desconhecido",
    produto = null,
    modoEdicao = false,
  } = route.params || {};

  const [nomeProduto, setNomeProduto] = useState("");
  const [calorias, setCalorias] = useState("");
  const [acucares, setAcucares] = useState("");
  const [sodio, setSodio] = useState("");
  const [gordurasSaturadas, setGordurasSaturadas] = useState("");

  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!produto) {
      return;
    }

    setNomeProduto(
      produto.nome_produto ??
        produto.nomeProduto ??
        ""
    );

    const valorCalorias =
      produto.calorias !== null &&
      produto.calorias !== undefined
        ? String(produto.calorias)
        : "";

    const valorAcucares =
      produto.acucares !== null &&
      produto.acucares !== undefined
        ? String(produto.acucares)
        : "";

    const valorSodio =
      produto.sodio !== null &&
      produto.sodio !== undefined
        ? String(produto.sodio)
        : "";

    const valorGorduras =
      produto.gorduras_saturadas !== null &&
      produto.gorduras_saturadas !== undefined
        ? String(produto.gorduras_saturadas)
        : "";

    setCalorias(valorCalorias);
    setAcucares(valorAcucares);
    setSodio(valorSodio);
    setGordurasSaturadas(valorGorduras);
  }, [produto]);

  function converterNumero(valor) {
    if (valor === null || valor === undefined) {
      return null;
    }

    const texto = String(valor).trim();

    if (!texto) {
      return null;
    }

    // Permite que o usuário digite 10,5 ou 10.5
    const normalizado = texto.replace(",", ".");
    const numero = Number(normalizado);

    if (Number.isNaN(numero)) {
      return null;
    }

    return numero;
  }

  function validarNumero(valor, nomeCampo) {
    if (!valor.trim()) {
      return true;
    }

    const numero = converterNumero(valor);

    if (numero === null) {
      Alert.alert(
        "Valor inválido",
        `Digite um valor numérico válido para ${nomeCampo}.`
      );
      return false;
    }

    if (numero < 0) {
      Alert.alert(
        "Valor inválido",
        `${nomeCampo} não pode ser negativo.`
      );
      return false;
    }

    return true;
  }

  async function salvarProduto() {
    Keyboard.dismiss();

    if (!nomeProduto.trim()) {
      Alert.alert(
        "Nome obrigatório",
        "Digite o nome do produto."
      );
      return;
    }

    if (!codigoBarras.trim()) {
      Alert.alert(
        "Código inválido",
        "O código de barras não foi informado."
      );
      return;
    }

    if (!validarNumero(calorias, "calorias")) {
      return;
    }

    if (!validarNumero(acucares, "açúcares")) {
      return;
    }

    if (!validarNumero(sodio, "sódio")) {
      return;
    }

    if (!validarNumero(gordurasSaturadas, "gorduras saturadas")) {
      return;
    }

    try {
      setCarregando(true);

      const agora = new Date().toISOString();

      const caloriasNumero = converterNumero(calorias);
      const acucaresNumero = converterNumero(acucares);
      const sodioNumero = converterNumero(sodio);
      const gordurasNumero = converterNumero(
        gordurasSaturadas
      );

      const produtoAtualizado = {
        id:
          modoEdicao && produto?.id
            ? produto.id
            : `manual-${codigoBarras}`,

        codigo_barras: codigoBarras.trim(),

        tipo_codigo:
          tipoCodigo ||
          produto?.tipo_codigo ||
          "desconhecido",

        nome_produto: nomeProduto.trim(),

        calorias: caloriasNumero,
        acucares: acucaresNumero,
        sodio: sodioNumero,
        gorduras_saturadas: gordurasNumero,

        criado_em:
          modoEdicao && produto?.criado_em
            ? produto.criado_em
            : agora,

        atualizado_em: agora,
      };

      /*
       * Primeiro salva localmente.
       * Dessa forma o aplicativo continua funcionando
       * mesmo sem internet.
       */
      if (modoEdicao) {
        await atualizarProduto(produtoAtualizado);
      } else {
        await inserirProduto(produtoAtualizado);
      }

      /*
       * Tenta salvar no Supabase.
       *
       * Se estiver sem internet, o produto continua salvo
       * no SQLite. Não vamos impedir a navegação por causa
       * de uma falha de conexão.
       */
      try {
        const { error } = await supabase
          .from("produtos")
          .upsert(
            {
              id: produtoAtualizado.id,
              codigo_barras:
                produtoAtualizado.codigo_barras,
              tipo_codigo:
                produtoAtualizado.tipo_codigo,
              nome_produto:
                produtoAtualizado.nome_produto,
              calorias:
                produtoAtualizado.calorias,
              acucares:
                produtoAtualizado.acucares,
              sodio:
                produtoAtualizado.sodio,
              gorduras_saturadas:
                produtoAtualizado.gorduras_saturadas,
              criado_em:
                produtoAtualizado.criado_em,
              atualizado_em:
                produtoAtualizado.atualizado_em,
            },
            {
              onConflict: "codigo_barras",
            }
          );

        if (error) {
          console.warn(
            "[CadastroProduto] Não foi possível sincronizar produto:",
            error
          );
        }
      } catch (supabaseError) {
        console.warn(
          "[CadastroProduto] Supabase indisponível:",
          supabaseError
        );
      }

      /*
       * Vai para Resultado utilizando o produto que acabou
       * de ser cadastrado/editado.
       */
      navigation.replace("Resultado", {
        codigoBarras: produtoAtualizado.codigo_barras,

        tipoCodigo:
          produtoAtualizado.tipo_codigo,

        produto: produtoAtualizado,

        origem: modoEdicao
          ? "manual_editado"
          : "manual",
      });
    } catch (error) {
      console.warn(
        "[CadastroProduto] Erro ao salvar produto:",
        error
      );

      Alert.alert(
        "Erro",
        "Não foi possível salvar o produto. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  function cancelar() {
    if (carregando) {
      return;
    }

    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.conteudo}>
            <View style={styles.cabecalho}>
              <Text style={styles.titulo}>
                {modoEdicao
                  ? "Editar produto"
                  : "Cadastrar produto"}
              </Text>

              <Text style={styles.subtitulo}>
                {modoEdicao
                  ? "Atualize as informações nutricionais do produto."
                  : "Informe os dados nutricionais encontrados no produto."}
              </Text>
            </View>

            <View style={styles.codigoBox}>
              <Text style={styles.codigoLabel}>
                Código de barras
              </Text>

              <Text style={styles.codigoValor}>
                {codigoBarras || "Não informado"}
              </Text>

              <Text style={styles.tipoCodigo}>
                Tipo: {tipoCodigo || "desconhecido"}
              </Text>
            </View>

            <View style={styles.formulario}>
              <Text style={styles.label}>
                Nome do produto *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Nome do produto"
                placeholderTextColor="#888"
                value={nomeProduto}
                onChangeText={setNomeProduto}
                autoCapitalize="sentences"
                autoCorrect={false}
                editable={!carregando}
                returnKeyType="next"
              />

              <Text style={styles.label}>
                Calorias (kcal/100g)
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 150"
                placeholderTextColor="#888"
                value={calorias}
                onChangeText={setCalorias}
                keyboardType="decimal-pad"
                editable={!carregando}
                returnKeyType="next"
              />

              <Text style={styles.label}>
                Açúcares (g/100g)
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 10,5"
                placeholderTextColor="#888"
                value={acucares}
                onChangeText={setAcucares}
                keyboardType="decimal-pad"
                editable={!carregando}
                returnKeyType="next"
              />

              <Text style={styles.label}>
                Sódio (mg/100g)
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 120"
                placeholderTextColor="#888"
                value={sodio}
                onChangeText={setSodio}
                keyboardType="decimal-pad"
                editable={!carregando}
                returnKeyType="next"
              />

              <Text style={styles.label}>
                Gorduras saturadas (g/100g)
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 2,5"
                placeholderTextColor="#888"
                value={gordurasSaturadas}
                onChangeText={setGordurasSaturadas}
                keyboardType="decimal-pad"
                editable={!carregando}
                returnKeyType="done"
                onSubmitEditing={salvarProduto}
              />

              <Text style={styles.observacao}>
                Os valores devem ser referentes a 100 g ou
                100 ml do produto, conforme informado no rótulo.
              </Text>

              <TouchableOpacity
                style={[
                  styles.botaoSalvar,
                  carregando && styles.botaoDesabilitado,
                ]}
                onPress={salvarProduto}
                disabled={carregando}
                activeOpacity={0.8}
              >
                {carregando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.botaoSalvarTexto}>
                    {modoEdicao
                      ? "Salvar alterações"
                      : "Cadastrar produto"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoCancelar}
                onPress={cancelar}
                disabled={carregando}
                activeOpacity={0.8}
              >
                <Text style={styles.botaoCancelarTexto}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },

  conteudo: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },

  cabecalho: {
    marginBottom: 20,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F3864",
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 15,
    color: "#666",
    lineHeight: 21,
  },

  codigoBox: {
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    padding: 15,
    marginBottom: 22,
  },

  codigoLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
  },

  codigoValor: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },

  tipoCodigo: {
    fontSize: 13,
    color: "#666",
  },

  formulario: {
    width: "100%",
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 7,
  },

  input: {
    width: "100%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#222",
    backgroundColor: "#FAFAFA",
    marginBottom: 18,
  },

  observacao: {
    fontSize: 13,
    color: "#777",
    lineHeight: 19,
    marginTop: -3,
    marginBottom: 20,
  },

  botaoSalvar: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#1F3864",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  botaoDesabilitado: {
    opacity: 0.7,
  },

  botaoSalvarTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  botaoCancelar: {
    width: "100%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#1F3864",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  botaoCancelarTexto: {
    color: "#1F3864",
    fontSize: 16,
    fontWeight: "700",
  },
});