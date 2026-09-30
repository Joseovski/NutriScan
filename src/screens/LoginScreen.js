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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function fazerLogin() {
    Keyboard.dismiss();
    setErro("");

    const emailLimpo = email.trim();

    if (!emailLimpo) {
      setErro("Digite seu e-mail.");
      return;
    }

    if (!senha) {
      setErro("Digite sua senha.");
      return;
    }

    try {
      setCarregando(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: emailLimpo,
        password: senha,
      });

      if (error) {
        throw error;
      }

      // O AppNavigator detecta automaticamente a sessão
      // e direciona para a tela principal.
    } catch (error) {
      console.warn("[LoginScreen] Erro ao fazer login:", error);

      let mensagem = "Não foi possível fazer login.";

      if (error?.message) {
        if (
          error.message.toLowerCase().includes("invalid login credentials")
        ) {
          mensagem = "E-mail ou senha incorretos.";
        } else if (
          error.message.toLowerCase().includes("email not confirmed")
        ) {
          mensagem = "Confirme seu e-mail antes de entrar.";
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
              <Text style={styles.titulo}>NutriScan</Text>

              <Text style={styles.subtitulo}>
                Analise seus produtos de forma rápida e prática.
              </Text>
            </View>

            <View style={styles.formulario}>
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
                textContentType="password"
                editable={!carregando}
                returnKeyType="done"
                onSubmitEditing={fazerLogin}
              />

              {erro ? <Text style={styles.erro}>{erro}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.botaoPrincipal,
                  carregando && styles.botaoDesabilitado,
                ]}
                onPress={fazerLogin}
                disabled={carregando}
                activeOpacity={0.8}
              >
                {carregando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botaoPrincipalTexto}>Entrar</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={() => navigation.navigate("Cadastro")}
                disabled={carregando}
                activeOpacity={0.8}
              >
                <Text style={styles.botaoSecundarioTexto}>
                  Criar uma conta
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
    justifyContent: "center",
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
    marginBottom: 35,
  },

  titulo: {
    fontSize: 34,
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
    marginBottom: 18,
  },

  erro: {
    color: "#C62828",
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
    marginTop: 4,
  },

  botaoDesabilitado: {
    opacity: 0.7,
  },

  botaoPrincipalTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  botaoSecundario: {
    width: "100%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#1F3864",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  botaoSecundarioTexto: {
    color: "#1F3864",
    fontSize: 16,
    fontWeight: "700",
  },
});