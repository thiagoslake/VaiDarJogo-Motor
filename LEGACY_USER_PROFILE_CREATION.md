# 👤 Criação de Perfil para Usuários Legados

## 📋 Resumo
Implementada funcionalidade para permitir que usuários legados (que não possuem perfil de jogador) possam criar seu perfil diretamente na tela de perfil.

## 🎯 Problema Resolvido

### **Usuários Legados:**
- ✅ Usuários que se registraram antes da implementação da criação automática de perfil
- ✅ Usuários que não possuem registro na tabela `players`
- ✅ Precisam criar perfil de jogador para participar de jogos

## 🔧 Implementação

### **1. Detecção de Usuário Legado:**
```dart
// Buscar perfil de jogador
final player = await PlayerService.getPlayerByUserId(currentUser.id);

if (player != null) {
  // Usuário com perfil existente
  setState(() {
    _player = player;
    _loadPlayerData();
  });
} else {
  // Usuário legado sem perfil - permitir criação
  setState(() {
    _player = null;
    _isEditing = true; // Iniciar em modo de edição
    _loadUserDataForProfile(); // Carregar dados do usuário
  });
}
```

### **2. Interface para Usuário Legado:**
```dart
if (_player == null && !_isEditing) ...[
  // Mensagem informativa
  Container(
    child: Column([
      Icon(Icons.info_outline, color: Colors.orange),
      Text('Você ainda não possui um perfil de jogador.'),
      Text('Clique em "Criar Perfil" para adicionar suas informações.'),
    ]),
  ),
  // Botão para criar perfil
  ElevatedButton.icon(
    onPressed: () => setState(() => _isEditing = true),
    icon: Icon(Icons.add),
    label: Text('Criar Perfil'),
  ),
]
```

### **3. Criação de Perfil:**
```dart
if (_player == null) {
  // Criar novo perfil de jogador
  final newPlayer = await PlayerService.createPlayer(
    userId: currentUser.id,
    name: _nameController.text.trim(),
    phoneNumber: _phoneController.text.trim(),
    type: _selectedPlayerType,
    // ... outros campos
  );
}
```

## 🎨 Interface do Usuário

### **Estado Inicial (Usuário Legado):**
- 📋 **Card Azul**: Informações da conta (sempre visível)
- 🟠 **Card Laranja**: Mensagem informativa sobre perfil ausente
- ➕ **Botão "Criar Perfil"**: Inicia o processo de criação

### **Modo de Criação:**
- 📝 **Formulário completo** com dados pré-preenchidos do usuário
- 🎯 **Campos obrigatórios**: Nome, telefone
- 📅 **Campos opcionais**: Data de nascimento, posições, pé preferido
- 💾 **Botão "Criar Perfil"**: Salva o novo perfil

### **Após Criação:**
- ✅ **Perfil criado** com sucesso
- 👁️ **Modo visualização** ativado
- 🔄 **Dados atualizados** exibidos

## 🔄 Fluxo Completo

### **1. Usuário Legado Acessa Perfil:**
```
Usuário clica no avatar → "Meu Perfil" → Tela de perfil carrega
```

### **2. Detecção Automática:**
```
Sistema verifica se existe perfil de jogador
├── Existe → Modo visualização normal
└── Não existe → Modo criação para usuário legado
```

### **3. Criação do Perfil:**
```
Usuário vê mensagem informativa → Clica "Criar Perfil" → Formulário aparece
├── Preenche dados → Clica "Criar Perfil" → Perfil salvo
└── Clica "Cancelar" → Volta à mensagem inicial
```

### **4. Após Criação:**
```
Perfil criado → Modo visualização → Usuário pode editar normalmente
```

## 📱 Estados da Interface

### **Estado 1: Usuário com Perfil**
- ✅ Card de informações da conta
- ✅ Card de perfil de jogador (dados preenchidos)
- ✅ Botão "Editar" no AppBar

### **Estado 2: Usuário Legado (Inicial)**
- ✅ Card de informações da conta
- 🟠 Card laranja com mensagem informativa
- ➕ Botão "Criar Perfil"

### **Estado 3: Usuário Legado (Editando)**
- ✅ Card de informações da conta
- 📝 Formulário de criação de perfil
- 💾 Botões "Criar Perfil" e "Cancelar"

### **Estado 4: Usuário Legado (Após Criação)**
- ✅ Card de informações da conta
- ✅ Card de perfil de jogador (dados criados)
- ✅ Botão "Editar" no AppBar

## 🗄️ Dados Pré-preenchidos

### **Do Usuário:**
```dart
_nameController.text = currentUser.name;
_phoneController.text = currentUser.phone ?? '';
```

### **Valores Padrão:**
```dart
_selectedPlayerType = 'casual';        // Tipo padrão
_selectedPrimaryPosition = 'Meias';    // Posição padrão
_selectedSecondaryPosition = 'Nenhuma'; // Sem posição secundária
_selectedPreferredFoot = 'Direita';    // Pé padrão
```

## ✅ Benefícios

1. **Compatibilidade**: Usuários legados podem usar o sistema
2. **Experiência Fluida**: Criação de perfil integrada
3. **Dados Pré-preenchidos**: Menos trabalho para o usuário
4. **Interface Intuitiva**: Mensagens claras e botões apropriados
5. **Validação**: Mesma validação de usuários novos
6. **Consistência**: Mesmo fluxo após criação do perfil

## 🧪 Teste Realizado

- ✅ Criação de usuário legado sem perfil
- ✅ Verificação de ausência de perfil
- ✅ Criação de perfil de jogador
- ✅ Validação de dados criados
- ✅ Limpeza de registros de teste

## 🎯 Casos de Uso

### **Usuário Legado:**
1. Acessa "Meu Perfil" pela primeira vez
2. Vê mensagem informativa sobre perfil ausente
3. Clica "Criar Perfil"
4. Preenche dados (alguns já preenchidos)
5. Clica "Criar Perfil"
6. Perfil é criado e pode ser editado normalmente

### **Usuário Novo:**
1. Perfil é criado automaticamente no registro
2. Acessa "Meu Perfil" e vê dados preenchidos
3. Pode editar normalmente

## 🔄 Próximos Passos

1. **Migração Automática**: Script para criar perfis para todos os usuários legados
2. **Notificação**: Avisar usuários legados sobre a necessidade de completar perfil
3. **Estatísticas**: Rastrear quantos usuários legados criaram perfil
