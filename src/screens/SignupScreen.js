import React, { useState } from "react";
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
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../config/supabase";

export default function SignupScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function criarConta() {
    Keyboard.dismiss();

    setErro("");
    setSucesso("");

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim();

    if (!nomeLimpo) {
      setErro("Digite seu nome.");
      return;
    }

    if (!emailLimpo) {
      setErro("Digite seu e-mail.");
      return;
    }

    if (!senha) {
      setErro("Digite uma senha.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    try {
      setCarregando(true);

      const { data, error } = await supabase.auth.signUp({
        email: emailLimpo,
        password: senha,
        options: {
          data: {
            nome: nomeLimpo,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        // Se o projeto Supabase estiver configurado
        // para não exigir confirmação de e-mail,
        // a sessão já será criada e o AppNavigator
        // fará o redirecionamento.
        return;
      }

      setSucesso(
        "Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro."
      );
    } catch (error) {
      console.warn("[SignupScreen] Erro ao criar conta:", error);

      let mensagem = "Não foi possível criar a conta.";

      if (error?.message) {
        if (error.message.toLowerCase().includes("already registered")) {
          mensagem = "Este e-mail já está cadastrado.";
        } else if (
          error.message.toLowerCase().includes("password should be at least")
        ) {
          mensagem = "A senha precisa ter pelo menos 6 caracteres.";
        } else {
          mensagem = error.message;
        }
      }

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
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
              <Text style={styles.titulo}>Criar conta</Text>

              <Text style={styles.subtitulo}>
                Cadastre-se para começar a usar o NutriScan.
              </Text>
            </View>

            <View style={styles.formulario}>
              <Text style={styles.label}>Nome</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite seu nome"
                placeholderTextColor="#888"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                editable={!carregando}
                returnKeyType="next"
              />

              <Text style={styles.label}>E-mail</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                editable={!carregando}
                returnKeyType="next"
              />

              <Text style={styles.label}>Senha</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#888"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                editable={!carregando}
                returnKeyType="next"
              />

              <Text style={styles.label}>Confirmar senha</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite a senha novamente"
                placeholderTextColor="#888"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                editable={!carregando}
                returnKeyType="done"
                onSubmitEditing={criarConta}
              />

              {erro ? <Text style={styles.erro}>{erro}</Text> : null}

              {sucesso ? (
                <Text style={styles.sucesso}>{sucesso}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.botaoPrincipal,
                  carregando && styles.botaoDesabilitado,
                ]}
                onPress={criarConta}
                disabled={carregando}
                activeOpacity={0.8}
              >
                {carregando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.botaoPrincipalTexto}>
                    Criar conta
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoVoltar}
                onPress={() => navigation.goBack()}
                disabled={carregando}
                activeOpacity={0.8}
              >
                <Text style={styles.botaoVoltarTexto}>
                  Voltar para o login
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
    paddingHorizontal: 24,
    paddingVertical: 30,
  },

  conteudo: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },

  cabecalho: {
    alignItems: "center",
    marginBottom: 30,
  },

  titulo: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1F3864",
    marginBottom: 10,
  },

  subtitulo: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
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
    height: 52,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#222",
    backgroundColor: "#FAFAFA",
    marginBottom: 17,
  },

  erro: {
    color: "#C62828",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },

  sucesso: {
    color: "#2E7D32",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },

  botaoPrincipal: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#1F3864",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  botaoDesabilitado: {
    opacity: 0.7,
  },

  botaoPrincipalTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  botaoVoltar: {
    width: "100%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#1F3864",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  botaoVoltarTexto: {
    color: "#1F3864",
    fontSize: 16,
    fontWeight: "700",
  },
});