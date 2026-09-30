import React, {
    useCallback,
    useState,
} from "react";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import { supabase } from "../config/supabase";
import { listarAnalises } from "../database/db";

import {
    SafeAreaView,
} from "react-native-safe-area-context";

import { StatusBar } from "expo-status-bar";

export default function HomeScreen({ navigation }) {
    const [nomeUsuario, setNomeUsuario] =
        useState("Usuário");

    const [ultimasAnalises, setUltimasAnalises] =
        useState([]);

    const [atualizando, setAtualizando] =
        useState(false);

    // =========================================================
    // CARREGAR DADOS
    // =========================================================

    const carregarDados = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            // -------------------------------------------------------
            // NOME DO USUÁRIO
            // -------------------------------------------------------

            const nome =
                user.user_metadata?.nome ||
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "Usuário";

            setNomeUsuario(nome);

            // -------------------------------------------------------
            // ÚLTIMAS ANÁLISES
            // -------------------------------------------------------

            const analises =
                await listarAnalises(user.id);

            setUltimasAnalises(
                analises.slice(0, 5)
            );

        } catch (error) {
            console.warn(
                "[HomeScreen] Erro ao carregar dados:",
                error
            );
        }
    };

    // =========================================================
    // CARREGAR AO ENTRAR NA HOME
    // =========================================================

    useFocusEffect(
        useCallback(() => {
            carregarDados();
        }, [])
    );

    // =========================================================
    // ATUALIZAR
    // =========================================================

    const atualizar = async () => {
        setAtualizando(true);

        try {
            await carregarDados();
        } finally {
            setAtualizando(false);
        }
    };

    // =========================================================
    // FORMATAR DATA
    // =========================================================

    const formatarData = (data) => {
        if (!data) return "";

        try {
            return new Date(
                data
            ).toLocaleDateString("pt-BR");
        } catch {
            return "";
        }
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <SafeAreaView
            style={styles.container}
            edges={["top", "bottom"]}
        >
            <StatusBar
                style="dark"
                backgroundColor="#F7F8FA"
                translucent={false}
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={atualizando}
                        onRefresh={atualizar}
                    />
                }
            >

                {/* ===================================================
            CABEÇALHO
        =================================================== */}

                <View style={styles.header}>

                    <Text style={styles.logo}>
                        NutriScan
                    </Text>

                    <Text style={styles.saudacao}>
                        Olá, {nomeUsuario}!
                    </Text>

                    <Text style={styles.subtitulo}>
                        O que você deseja fazer?
                    </Text>

                </View>

                {/* ===================================================
            NOVA ANÁLISE
        =================================================== */}

                <TouchableOpacity
                    style={styles.botaoPrincipal}
                    onPress={() =>
                        navigation.navigate("Camera")
                    }
                    activeOpacity={0.8}
                >
                    <Text
                        style={
                            styles.botaoPrincipalTitulo
                        }
                    >
                        NOVA ANÁLISE
                    </Text>

                    <Text
                        style={
                            styles.botaoPrincipalTexto
                        }
                    >
                        Ler código de barras de um produto
                    </Text>

                </TouchableOpacity>

                {/* ===================================================
            OPÇÕES
        =================================================== */}

                <View style={styles.linhaBotoes}>

                    {/* HISTÓRICO */}

                    <TouchableOpacity
                        style={styles.botaoOpcao}
                        onPress={() =>
                            navigation.navigate("Historico")
                        }
                        activeOpacity={0.8}
                    >
                        <Text style={styles.botaoOpcaoTitulo}>
                            HISTÓRICO
                        </Text>

                        <Text style={styles.botaoOpcaoTexto}>
                            Ver análises anteriores
                        </Text>
                    </TouchableOpacity>

                    {/* MINHA CONTA */}

                    <TouchableOpacity
                        style={styles.botaoOpcao}
                        onPress={() =>
                            navigation.navigate("Conta")
                        }
                        activeOpacity={0.8}
                    >
                        <Text style={styles.botaoOpcaoTitulo}>
                            MINHA CONTA
                        </Text>

                        <Text style={styles.botaoOpcaoTexto}>
                            Gerenciar sua conta
                        </Text>
                    </TouchableOpacity>

                </View>

                {/* ===================================================
            PASTAS
        =================================================== */}

                <TouchableOpacity
                    style={[
                        styles.botaoPasta,
                        styles.botaoDesativado,
                    ]}
                    disabled={true}
                    activeOpacity={1}
                >

                    <View
                        style={
                            styles.pastaCabecalho
                        }
                    >

                        <Text
                            style={[
                                styles.botaoPastaTitulo,
                                styles.textoDesativado,
                            ]}
                        >
                            MINHAS PASTAS
                        </Text>

                        <Text
                            style={styles.emBreve}
                        >
                            EM BREVE
                        </Text>

                    </View>

                    <Text
                        style={[
                            styles.botaoPastaTexto,
                            styles.textoDesativado,
                        ]}
                    >
                        Organize seus produtos em listas
                        e acompanhe a avaliação nutricional
                        de cada pasta.
                    </Text>

                </TouchableOpacity>

                {/* ===================================================
            ÚLTIMAS ANÁLISES
        =================================================== */}

                <View style={styles.secao}>

                    <Text
                        style={styles.tituloSecao}
                    >
                        Últimas análises
                    </Text>

                    {ultimasAnalises.length === 0 ? (

                        <View style={styles.vazio}>

                            <Text
                                style={styles.vazioTexto}
                            >
                                Você ainda não realizou
                                nenhuma análise.
                            </Text>

                            <Text
                                style={
                                    styles.vazioSubtexto
                                }
                            >
                                Faça sua primeira análise
                                escaneando um código de barras.
                            </Text>

                        </View>

                    ) : (

                        ultimasAnalises.map((item) => (

                            <TouchableOpacity
                                key={item.id}
                                style={styles.cardAnalise}
                                onPress={() =>
                                    navigation.navigate(
                                        "Historico"
                                    )
                                }
                                activeOpacity={0.8}
                            >

                                <View
                                    style={styles.cardInfo}
                                >

                                    <Text
                                        style={styles.nomeProduto}
                                        numberOfLines={1}
                                    >
                                        {item.nome_produto ||
                                            "Produto sem nome"}
                                    </Text>

                                    <Text
                                        style={styles.dataAnalise}
                                    >
                                        {formatarData(
                                            item.criado_em
                                        )}
                                    </Text>

                                </View>

                                <View
                                    style={[
                                        styles.status,
                                        item.status ===
                                        "saudavel" &&
                                        styles.statusSaudavel,

                                        item.status ===
                                        "moderado" &&
                                        styles.statusModerado,

                                        item.status ===
                                        "evitar" &&
                                        styles.statusEvitar,
                                    ]}
                                >

                                    <Text
                                        style={styles.statusTexto}
                                    >
                                        {item.status ===
                                            "saudavel"
                                            ? "Saudável"
                                            : item.status ===
                                                "moderado"
                                                ? "Moderado"
                                                : item.status ===
                                                    "evitar"
                                                    ? "Evitar"
                                                    : "Sem classificação"}
                                    </Text>

                                </View>

                            </TouchableOpacity>

                        ))
                    )}

                </View>

            </ScrollView>

        </SafeAreaView>
    );
}

// ===========================================================
// ESTILOS
// ===========================================================

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F7F8FA",
    },

    content: {
        padding: 20,
        paddingBottom: 35,
    },

    // =========================================================
    // CABEÇALHO
    // =========================================================

    header: {
        marginBottom: 25,
    },

    logo: {
        fontSize: 30,
        fontWeight: "800",
        color: "#1F3864",
        marginBottom: 20,
    },

    saudacao: {
        fontSize: 24,
        fontWeight: "700",
        color: "#222",
        marginBottom: 5,
    },

    subtitulo: {
        fontSize: 16,
        color: "#666",
    },

    // =========================================================
    // NOVA ANÁLISE
    // =========================================================

    botaoPrincipal: {
        backgroundColor: "#1F3864",
        borderRadius: 14,
        padding: 22,
        marginBottom: 15,
    },

    botaoPrincipalTitulo: {
        color: "#FFF",
        fontSize: 19,
        fontWeight: "800",
        marginBottom: 5,
    },

    botaoPrincipalTexto: {
        color: "#E8EDF5",
        fontSize: 14,
    },

    // =========================================================
    // OPÇÕES
    // =========================================================

    linhaBotoes: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },

    botaoOpcao: {
        flex: 1,
        backgroundColor: "#FFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        padding: 16,
        minHeight: 105,
    },

    botaoDesativado: {
        backgroundColor: "#EEEEEE",
        borderColor: "#D5D5D5",
    },

    botaoOpcaoTitulo: {
        color: "#1F3864",
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 7,
    },

    botaoOpcaoTexto: {
        color: "#666",
        fontSize: 13,
        lineHeight: 18,
    },

    tituloComStatus: {
        marginBottom: 7,
    },

    emBreve: {
        alignSelf: "flex-start",
        backgroundColor: "#D5D5D5",
        color: "#666",
        fontSize: 9,
        fontWeight: "800",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 5,
        overflow: "hidden",
    },

    // =========================================================
    // PASTAS
    // =========================================================

    botaoPasta: {
        backgroundColor: "#FFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        padding: 18,
        marginBottom: 25,
    },

    pastaCabecalho: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },

    botaoPastaTitulo: {
        color: "#1F3864",
        fontSize: 17,
        fontWeight: "800",
    },

    botaoPastaTexto: {
        color: "#666",
        fontSize: 13,
        lineHeight: 19,
    },

    textoDesativado: {
        color: "#888",
    },

    // =========================================================
    // ÚLTIMAS ANÁLISES
    // =========================================================

    secao: {
        marginTop: 5,
    },

    tituloSecao: {
        fontSize: 20,
        fontWeight: "800",
        color: "#222",
        marginBottom: 12,
    },

    vazio: {
        backgroundColor: "#FFF",
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },

    vazioTexto: {
        fontSize: 15,
        fontWeight: "600",
        color: "#444",
        marginBottom: 6,
    },

    vazioSubtexto: {
        fontSize: 13,
        color: "#777",
        lineHeight: 19,
    },

    cardAnalise: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    cardInfo: {
        flex: 1,
        marginRight: 10,
    },

    nomeProduto: {
        fontSize: 15,
        fontWeight: "700",
        color: "#222",
        marginBottom: 4,
    },

    dataAnalise: {
        fontSize: 12,
        color: "#888",
    },

    status: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },

    statusSaudavel: {
        backgroundColor: "#DFF2E1",
    },

    statusModerado: {
        backgroundColor: "#FFF1C7",
    },

    statusEvitar: {
        backgroundColor: "#F8D7DA",
    },

    statusTexto: {
        fontSize: 11,
        fontWeight: "800",
        color: "#444",
    },

});