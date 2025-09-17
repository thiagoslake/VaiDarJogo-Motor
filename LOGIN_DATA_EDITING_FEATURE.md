# 🔐 Edição de Dados de Login - Email e Senha

## 📋 Resumo
Implementada funcionalidade completa para permitir que os usuários alterem seus dados de login (email e senha) diretamente na tela "Meu Perfil".

## 🎯 Funcionalidades Implementadas

### **1. Alteração de Email:**
- ✅ **Validação de Senha**: Senha atual obrigatória para alterar email
- ✅ **Validação de Formato**: Email deve ter formato válido
- ✅ **Atualização Dupla**: Email atualizado no Supabase Auth e na tabela users
- ✅ **Feedback Visual**: Mensagens de sucesso/erro

### **2. Alteração de Senha:**
- ✅ **Validação de Senha Atual**: Obrigatória para alterar senha
- ✅ **Validação de Nova Senha**: Mínimo 6 caracteres
- ✅ **Confirmação de Senha**: Nova senha deve ser confirmada
- ✅ **Atualização Segura**: Senha atualizada no Supabase Auth
- ✅ **Limpeza de Campos**: Campos limpos após sucesso

## 🔧 Implementação Técnica

### **1. AuthService - Novos Métodos:**

#### **Atualizar Email:**
```dart
static Future<bool> updateEmail({
  required String newEmail,
  required String password,
}) async {
  try {
    final currentUser = _client.auth.currentUser;
    if (currentUser == null) {
      throw Exception('Usuário não autenticado');
    }

    // Atualizar email no Supabase Auth
    await _client.auth.updateUser(
      UserAttributes(email: newEmail),
    );

    // Atualizar email na tabela users
    await _client
        .from('users')
        .update({'email': newEmail})
        .eq('id', currentUser.id);

    return true;
  } catch (e) {
    print('❌ Erro ao atualizar email: $e');
    rethrow;
  }
}
```

#### **Atualizar Senha:**
```dart
static Future<bool> updatePassword({
  required String currentPassword,
  required String newPassword,
}) async {
  try {
    // Atualizar senha no Supabase Auth
    await _client.auth.updateUser(
      UserAttributes(password: newPassword),
    );

    return true;
  } catch (e) {
    print('❌ Erro ao atualizar senha: $e');
    rethrow;
  }
}
```

### **2. AuthProvider - Novos Métodos:**

#### **Atualizar Email:**
```dart
Future<bool> updateEmail({
  required String newEmail,
  required String password,
}) async {
  if (state.user == null) return false;
  
  state = state.copyWith(isLoading: true, error: null);
  
  try {
    final success = await AuthService.updateEmail(
      newEmail: newEmail,
      password: password,
    );
    
    if (success) {
      // Atualizar o estado do usuário com o novo email
      final updatedUser = state.user!.copyWith(email: newEmail);
      state = state.copyWith(
        user: updatedUser,
        isLoading: false,
        error: null,
      );
      return true;
    }
    
    return false;
  } catch (e) {
    state = state.copyWith(
      isLoading: false,
      error: e.toString(),
    );
    return false;
  }
}
```

#### **Atualizar Senha:**
```dart
Future<bool> updatePassword({
  required String currentPassword,
  required String newPassword,
}) async {
  if (state.user == null) return false;
  
  state = state.copyWith(isLoading: true, error: null);
  
  try {
    final success = await AuthService.updatePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
    
    if (success) {
      state = state.copyWith(
        isLoading: false,
        error: null,
      );
      return true;
    }
    
    return false;
  } catch (e) {
    state = state.copyWith(
      isLoading: false,
      error: e.toString(),
    );
    return false;
  }
}
```

### **3. UserProfileScreen - Lógica de Atualização:**

#### **Detecção de Alterações:**
```dart
// Verificar se o email foi alterado
bool emailChanged = _emailController.text.trim() != currentUser.email;

// Verificar se a senha foi alterada
bool passwordChanged = _newPasswordController.text.isNotEmpty;
```

#### **Validações:**
```dart
// Se o email foi alterado, validar senha atual
if (emailChanged) {
  if (_currentPasswordController.text.isEmpty) {
    setState(() {
      _error = 'Senha atual é obrigatória para alterar o email';
    });
    return false;
  }
}

if (passwordChanged) {
  // Validar senha atual
  if (_currentPasswordController.text.isEmpty) {
    setState(() {
      _error = 'Senha atual é obrigatória para alterar a senha';
    });
    return false;
  }
  
  // Validar nova senha
  if (_newPasswordController.text != _confirmPasswordController.text) {
    setState(() {
      _error = 'Nova senha e confirmação não coincidem';
    });
    return false;
  }
  
  if (_newPasswordController.text.length < 6) {
    setState(() {
      _error = 'Nova senha deve ter pelo menos 6 caracteres';
    });
    return false;
  }
}
```

#### **Atualizações Sequenciais:**
```dart
// 1. Atualizar dados básicos (nome e telefone)
final userUpdated = await ref.read(authStateProvider.notifier).updateProfile(
  name: _nameController.text.trim(),
  phone: _phoneController.text.trim(),
);

// 2. Se o email foi alterado, atualizar email
if (emailChanged) {
  final emailUpdated = await ref.read(authStateProvider.notifier).updateEmail(
    newEmail: _emailController.text.trim(),
    password: _currentPasswordController.text,
  );
}

// 3. Se a senha foi alterada, atualizar senha
if (passwordChanged) {
  final passwordUpdated = await ref.read(authStateProvider.notifier).updatePassword(
    currentPassword: _currentPasswordController.text,
    newPassword: _newPasswordController.text,
  );
}
```

## 🎨 Interface do Usuário

### **Seção de Alteração de Dados de Login:**
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
      Icon(Icons.security_outlined),
      Text('Alterar Dados de Login (opcional)'),
    ]),
    
    // Texto explicativo
    Text('Para alterar o email ou senha, é necessário informar a senha atual.'),
    
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

### **Campos de Dados:**
- 📧 **Email**: Campo editável com validação de formato
- 🔒 **Senha Atual**: Obrigatória para alterações
- 🔑 **Nova Senha**: Mínimo 6 caracteres
- ✅ **Confirmar Senha**: Deve coincidir com nova senha

## 🛡️ Validações Implementadas

### **Alteração de Email:**
- ✅ **Senha Atual**: Obrigatória para alterar email
- ✅ **Formato de Email**: Validação de formato válido
- ✅ **Email Diferente**: Deve ser diferente do atual

### **Alteração de Senha:**
- ✅ **Senha Atual**: Obrigatória para alterar senha
- ✅ **Nova Senha**: Mínimo 6 caracteres
- ✅ **Confirmação**: Deve coincidir com nova senha
- ✅ **Senha Diferente**: Deve ser diferente da atual

## 🔄 Fluxo de Atualização

### **1. Detecção de Alterações:**
- ✅ **Email**: Compara com email atual do usuário
- ✅ **Senha**: Verifica se nova senha foi preenchida

### **2. Validações:**
- ✅ **Senha Atual**: Obrigatória para qualquer alteração
- ✅ **Formato**: Email válido, senha com mínimo de caracteres
- ✅ **Confirmação**: Nova senha confirmada

### **3. Atualizações:**
- ✅ **Dados Básicos**: Nome e telefone primeiro
- ✅ **Email**: Atualizado no Supabase Auth e tabela users
- ✅ **Senha**: Atualizada no Supabase Auth

### **4. Limpeza:**
- ✅ **Campos de Senha**: Limpos após sucesso
- ✅ **Estado**: Atualizado com novos dados

## 🔐 Segurança

### **Autenticação:**
- ✅ **Senha Atual**: Obrigatória para alterações
- ✅ **Verificação**: Senha validada antes das alterações
- ✅ **Sessão**: Usuário deve estar autenticado

### **Validação:**
- ✅ **Formato de Email**: Regex para validação
- ✅ **Tamanho da Senha**: Mínimo 6 caracteres
- ✅ **Confirmação**: Nova senha deve ser confirmada

### **Atualização Segura:**
- ✅ **Supabase Auth**: Email e senha atualizados no sistema de autenticação
- ✅ **Tabela Users**: Email sincronizado na tabela de usuários
- ✅ **Estado**: Estado da aplicação atualizado

## 📱 Experiência do Usuário

### **Interface Intuitiva:**
- ✅ **Seção Destacada**: Container com fundo cinza claro
- ✅ **Título Claro**: "Alterar Dados de Login (opcional)"
- ✅ **Texto Explicativo**: Instruções claras sobre senha atual
- ✅ **Campos Organizados**: Senha atual, nova senha, confirmação

### **Validação em Tempo Real:**
- ✅ **Mensagens de Erro**: Exibidas imediatamente
- ✅ **Validação de Formato**: Email e senha validados
- ✅ **Confirmação**: Senhas devem coincidir

### **Feedback:**
- ✅ **Mensagens de Sucesso**: Confirmação de alterações
- ✅ **Mensagens de Erro**: Erros específicos e claros
- ✅ **Loading**: Indicador durante processamento

## 🔄 Integração com Backend

### **Supabase Auth:**
```dart
// Atualizar email
await _client.auth.updateUser(
  UserAttributes(email: newEmail),
);

// Atualizar senha
await _client.auth.updateUser(
  UserAttributes(password: newPassword),
);
```

### **Tabela Users:**
```dart
// Sincronizar email na tabela users
await _client
    .from('users')
    .update({'email': newEmail})
    .eq('id', currentUser.id);
```

### **Estado da Aplicação:**
```dart
// Atualizar estado com novo email
final updatedUser = state.user!.copyWith(email: newEmail);
state = state.copyWith(user: updatedUser);
```

## ✅ Benefícios

1. **Segurança**: Senha atual obrigatória para alterações
2. **Validação Robusta**: Múltiplas validações para dados sensíveis
3. **Interface Intuitiva**: Seção clara e organizada
4. **Feedback Claro**: Mensagens de sucesso/erro específicas
5. **Sincronização**: Dados atualizados em todos os sistemas
6. **Flexibilidade**: Email e senha podem ser alterados independentemente

## 🎯 Casos de Uso

### **Alterar Email:**
1. Usuário acessa "Meu Perfil"
2. Clica "Editar"
3. Modifica o email
4. Informa senha atual
5. Clica "Salvar"
6. Email é atualizado

### **Alterar Senha:**
1. Usuário acessa "Meu Perfil"
2. Clica "Editar"
3. Informa senha atual
4. Digita nova senha
5. Confirma nova senha
6. Clica "Salvar"
7. Senha é atualizada

### **Alterar Email e Senha:**
1. Usuário acessa "Meu Perfil"
2. Clica "Editar"
3. Modifica email
4. Informa senha atual
5. Digita nova senha
6. Confirma nova senha
7. Clica "Salvar"
8. Email e senha são atualizados

Agora os usuários podem alterar completamente seus dados de login (email e senha) com segurança e validações robustas! 🚀
