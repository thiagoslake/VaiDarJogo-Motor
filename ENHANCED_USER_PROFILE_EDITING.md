# 👤 Edição Completa de Dados do Usuário e Jogador

## 📋 Resumo
Implementada funcionalidade completa para editar dados do usuário (email e senha) e todos os dados do jogador na tela "Meu Perfil".

## 🎯 Funcionalidades Implementadas

### **1. Edição de Dados do Usuário:**
- ✅ **Nome**: Campo editável com validação
- ✅ **Email**: Campo editável com validação de formato
- ✅ **Telefone**: Campo editável com validação
- ✅ **Senha**: Seção opcional para alteração de senha

### **2. Edição de Dados do Jogador:**
- ✅ **Nome**: Campo editável
- ✅ **Telefone**: Campo editável
- ✅ **Tipo**: Dropdown (Avulso/Mensalista)
- ✅ **Data de Nascimento**: Seletor de data
- ✅ **Posição Principal**: Dropdown com opções
- ✅ **Posição Secundária**: Dropdown com opções
- ✅ **Pé Preferido**: Dropdown (Direita/Esquerda/Ambidestro)

## 🔧 Implementação Técnica

### **1. Controllers Adicionados:**
```dart
final _emailController = TextEditingController();
final _currentPasswordController = TextEditingController();
final _newPasswordController = TextEditingController();
final _confirmPasswordController = TextEditingController();
```

### **2. Controle de Visibilidade das Senhas:**
```dart
bool _obscureCurrentPassword = true;
bool _obscureNewPassword = true;
bool _obscureConfirmPassword = true;
```

### **3. Validação de Email:**
```dart
validator: (value) {
  if (value == null || value.trim().isEmpty) {
    return 'Email é obrigatório';
  }
  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
    return 'Email inválido';
  }
  return null;
},
```

### **4. Validação de Senha:**
```dart
validator: (value) {
  if (value != null && value.isNotEmpty && value.length < 6) {
    return 'Senha deve ter pelo menos 6 caracteres';
  }
  return null;
},
```

## 🎨 Interface do Usuário

### **Seção de Alteração de Senha:**
```dart
Container(
  padding: const EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: Colors.grey.shade50,
    borderRadius: BorderRadius.circular(8),
    border: Border.all(color: Colors.grey.shade300),
  ),
  child: Column([
    // Título da seção
    Row([
      Icon(Icons.lock_outline),
      Text('Alterar Senha (opcional)'),
    ]),
    
    // Senha atual
    TextFormField(
      controller: _currentPasswordController,
      obscureText: _obscureCurrentPassword,
      suffixIcon: IconButton(...), // Toggle visibilidade
    ),
    
    // Nova senha
    TextFormField(
      controller: _newPasswordController,
      obscureText: _obscureNewPassword,
      suffixIcon: IconButton(...), // Toggle visibilidade
    ),
    
    // Confirmar senha
    TextFormField(
      controller: _confirmPasswordController,
      obscureText: _obscureConfirmPassword,
      suffixIcon: IconButton(...), // Toggle visibilidade
    ),
  ]),
)
```

### **Campos de Dados do Usuário:**
- 📝 **Nome**: Campo obrigatório
- 📧 **Email**: Campo obrigatório com validação de formato
- 📱 **Telefone**: Campo obrigatório
- 🔒 **Senha**: Seção opcional com 3 campos

### **Campos de Dados do Jogador:**
- 📝 **Nome**: Campo obrigatório
- 📱 **Telefone**: Campo obrigatório
- 🎯 **Tipo**: Dropdown (Avulso/Mensalista)
- 📅 **Data de Nascimento**: Seletor de data
- ⚽ **Posição Principal**: Dropdown
- 🔄 **Posição Secundária**: Dropdown
- 🦵 **Pé Preferido**: Dropdown

## 🔄 Fluxo de Edição

### **1. Modo Visualização:**
- ✅ Dados do usuário em card azul
- ✅ Dados do jogador em card verde
- ✅ Botão "Editar" no AppBar

### **2. Modo Edição:**
- ✅ Formulário completo com todos os campos
- ✅ Validação em tempo real
- ✅ Seção de senha opcional
- ✅ Botões "Salvar" e "Cancelar"

### **3. Salvamento:**
- ✅ Atualização dos dados do usuário
- ✅ Atualização dos dados do jogador
- ✅ Validação de senha (se alterada)
- ✅ Mensagem de sucesso/erro

## 🛡️ Validações Implementadas

### **Dados do Usuário:**
- ✅ **Nome**: Obrigatório
- ✅ **Email**: Obrigatório e formato válido
- ✅ **Telefone**: Obrigatório

### **Alteração de Senha:**
- ✅ **Senha Atual**: Obrigatória se nova senha for preenchida
- ✅ **Nova Senha**: Mínimo 6 caracteres
- ✅ **Confirmação**: Deve coincidir com nova senha

### **Dados do Jogador:**
- ✅ **Nome**: Obrigatório
- ✅ **Telefone**: Obrigatório
- ✅ **Tipo**: Seleção obrigatória
- ✅ **Data de Nascimento**: Opcional
- ✅ **Posições**: Opcionais

## 🔐 Segurança

### **Senhas:**
- ✅ **Visibilidade**: Toggle para mostrar/ocultar
- ✅ **Validação**: Senha atual obrigatória
- ✅ **Confirmação**: Nova senha deve ser confirmada
- ✅ **Limpeza**: Campos limpos após salvamento

### **Dados Sensíveis:**
- ✅ **Email**: Validação de formato
- ✅ **Telefone**: Validação de formato
- ✅ **Senha**: Mínimo 6 caracteres

## 📱 Experiência do Usuário

### **Interface Intuitiva:**
- ✅ **Seções Organizadas**: Dados do usuário e jogador separados
- ✅ **Validação Visual**: Mensagens de erro claras
- ✅ **Feedback**: Mensagens de sucesso/erro
- ✅ **Navegação**: Botões claros para salvar/cancelar

### **Funcionalidades:**
- ✅ **Edição Completa**: Todos os dados podem ser editados
- ✅ **Validação em Tempo Real**: Erros mostrados imediatamente
- ✅ **Cancelamento**: Volta aos dados originais
- ✅ **Salvamento**: Atualiza dados no banco

## 🔄 Integração com Backend

### **Atualização de Dados do Usuário:**
```dart
final userUpdated = await ref.read(authStateProvider.notifier).updateProfile(
  name: _nameController.text.trim(),
  phone: _phoneController.text.trim(),
);
```

### **Atualização de Dados do Jogador:**
```dart
final updatedPlayer = await PlayerService.updatePlayer(
  playerId: _player!.id,
  name: _nameController.text.trim(),
  phoneNumber: _phoneController.text.trim(),
  type: _selectedPlayerType,
  // ... outros campos
);
```

## ✅ Benefícios

1. **Edição Completa**: Todos os dados podem ser editados
2. **Validação Robusta**: Múltiplas validações para dados sensíveis
3. **Interface Intuitiva**: Formulário organizado e claro
4. **Segurança**: Validação de senha atual para alterações
5. **Feedback**: Mensagens claras de sucesso/erro
6. **Flexibilidade**: Senha opcional, outros campos obrigatórios

## 🎯 Casos de Uso

### **Usuário Regular:**
1. Acessa "Meu Perfil"
2. Clica "Editar"
3. Modifica dados desejados
4. Altera senha (opcional)
5. Clica "Salvar"
6. Dados são atualizados

### **Usuário Legado:**
1. Acessa "Meu Perfil"
2. Vê mensagem para criar perfil
3. Clica "Criar Perfil"
4. Preenche dados do usuário e jogador
5. Clica "Criar Perfil"
6. Perfil é criado e pode ser editado

Agora os usuários podem editar completamente seus dados pessoais e de jogador, incluindo email e senha, com uma interface intuitiva e validações robustas! 🚀
