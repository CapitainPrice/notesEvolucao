import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ANOTACOES_KEY = "anotacoes_do_app";

export default function AnoteAqui() {
  const [anotacao, setAnotacao] = useState("");
  const [listaAnotacoes, setListaAnotacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // <- controle para edição

  useEffect(() => {
    carregarAnotacoes();
  }, []);

  const salvarAnotacao = async () => {
    if (!anotacao.trim()) {
      Alert.alert("Erro", "A anotação não pode estar vazia.");
      return;
    }

    setCarregando(true);

    try {
      const data = await AsyncStorage.getItem(ANOTACOES_KEY);
      let anotacoes = data ? JSON.parse(data) : [];

      if (editandoId) {
        // Atualizar anotação existente
        anotacoes = anotacoes.map(item =>
          item.id === editandoId ? { ...item, texto: anotacao } : item
        );
        setEditandoId(null);
      } else {
        // Criar nova anotação
        const novaAnotacao = {
          id: Date.now().toString(),
          texto: anotacao,
          data: new Date().toLocaleDateString("pt-BR"),
          hora: new Date().toLocaleTimeString("pt-BR"),
          timestamp: Date.now(),
        };
        anotacoes.unshift(novaAnotacao);
      }

      await AsyncStorage.setItem(ANOTACOES_KEY, JSON.stringify(anotacoes));
      setAnotacao("");
      setListaAnotacoes(anotacoes);

    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Não foi possível salvar a anotação.");
    } finally {
      setCarregando(false);
    }
  };

  const carregarAnotacoes = async () => {
    try {
      const data = await AsyncStorage.getItem(ANOTACOES_KEY);
      if (data) {
        setListaAnotacoes(JSON.parse(data));
      } else {
        setListaAnotacoes([]);
      }
    } catch (e) {
      console.error(e);
      setListaAnotacoes([]);
    }
  };

  const limparTudo = async () => {
    try {
      await AsyncStorage.removeItem(ANOTACOES_KEY);
      setListaAnotacoes([]);
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Não foi possível limpar as anotações.");
    }
  };

  // Excluir sem alerta
  const excluirAnotacao = async (id) => {
    try {
      const novasAnotacoes = listaAnotacoes.filter(item => item.id !== id);
      await AsyncStorage.setItem(ANOTACOES_KEY, JSON.stringify(novasAnotacoes));
      setListaAnotacoes(novasAnotacoes);
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Não foi possível excluir a anotação.");
    }
  };

  const editarAnotacao = (item) => {
    setAnotacao(item.texto);
    setEditandoId(item.id);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemData}>
          {item.data} - {item.hora}
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={() => editarAnotacao(item)}>
            <Text style={styles.editText}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => excluirAnotacao(item.id)}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.itemText}>{item.texto}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.titulo}>Meu App de Anotações</Text>
          <Text style={styles.subtitulo}>
            {listaAnotacoes.length}{" "}
            {listaAnotacoes.length === 1 ? "anotação" : "anotações"}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escreva sua anotação..."
            placeholderTextColor="#999"
            value={anotacao}
            onChangeText={setAnotacao}
            multiline
            textAlignVertical="top"
            editable={!carregando}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              (!anotacao.trim() || carregando) && styles.disabledButton,
            ]}
            onPress={salvarAnotacao}
            disabled={!anotacao.trim() || carregando}
          >
            <Text style={styles.buttonText}>
              {carregando
                ? "Salvando..."
                : editandoId
                ? "Atualizar Anotação"
                : "Salvar Anotação"}
            </Text>
          </TouchableOpacity>

          {listaAnotacoes.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={limparTudo}
            >
              <Text style={styles.buttonText}>Limpar Tudo</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={listaAnotacoes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma anotação salva ainda.</Text>
            </View>
          }
          style={styles.list}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  titulo: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#333" },
  subtitulo: { fontSize: 16, textAlign: "center", color: "#666", marginTop: 5 },
  inputContainer: { padding: 20 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: "top",
  },
  buttonContainer: { paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: { backgroundColor: "#007AFF" },
  clearButton: { backgroundColor: "#FF3B30" },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemData: { fontSize: 12, color: "#666", fontWeight: "500" },
  itemText: { fontSize: 16, color: "#333", lineHeight: 22 },
  deleteText: { fontSize: 18, color: "#FF3B30", fontWeight: "bold" },
  editText: { fontSize: 18, color: "#007AFF", fontWeight: "bold" },
  emptyContainer: { alignItems: "center", padding: 40 },
  emptyText: { fontSize: 16, color: "#666", textAlign: "center" },
});