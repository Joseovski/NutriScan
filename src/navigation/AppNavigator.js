import React, { useEffect, useState } from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import CameraScreen from "../screens/CameraScreen";
import ResultScreen from "../screens/ResultScreen";
import HistoryScreen from "../screens/HistoryScreen";

import { supabase } from "../config/supabase";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.warn("[Auth] Erro ao verificar sessão:", error);
      }

      setSessao(data?.session ?? null);
      setCarregando(false);
    }

    verificarSessao();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSessao(session);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (carregando) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={sessao ? "Camera" : "Login"}
        screenOptions={{
          headerStyle: { backgroundColor: "#1F3864" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Login", headerShown: false }}
        />

        <Stack.Screen
          name="Cadastro"
          component={SignupScreen}
          options={{ title: "Criar conta", headerShown: false }}
        />

        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ title: "NutriScan", headerShown: false }}
        />

        <Stack.Screen
          name="Resultado"
          component={ResultScreen}
          options={{ title: "Resultado da Análise" }}
        />

        <Stack.Screen
          name="Historico"
          component={HistoryScreen}
          options={{ title: "Histórico" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}