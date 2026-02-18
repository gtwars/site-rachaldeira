# Sistema Rachaldeira - Setup e Próximos Passos

## ✅ O Que Está Funcionando

O projeto Next.js está **configurado e pronto** com:

### 1. Arquitetura Base
- ✅ Next.js 15 com App Router e TypeScript
- ✅ TailwindCSS para estilização
- ✅ Lucide React para ícones
- ✅ Supabase integrado (client + server + middleware)

### 2. Banco de Dados
- ✅ Schema SQL completo com 12 tabelas
- ✅ RLS policies implementadas (por role: admin/user)
- ✅ Migrations prontas para execução
- ✅ Seed data para testes

### 3. Autenticação
- ✅ Login (`/login`)
- ✅ Cadastro (`/signup`)
- ✅ Recuperação de senha (`/forgot-password`)
- ✅ Middleware protegendo rotas `/admin/*`

### 4. Componentes UI
- ✅ Button, Card, Table, Modal
- ✅ Input, Select, Textarea
- ✅ Navbar com navegação e controle de admin
- ✅ CountdownTimer component

### 5. Páginas Implementadas

#### Páginas Principais
- ✅ **Home** (`/`) - História, próximos rachas/campeonatos, Instagram
- ✅ **Integrantes** (`/integrantes`) - Grid com fotos e posições

#### Rachas (Usuário)
- ✅ **Lista de rachas** (`/rachas`) - Próximos e histórico
- ✅ **Próximo racha** (`/rachas/proximo`) - Confirmação de presença com countdown

#### Admin
- ✅ **CRUD Integrantes** (`/admin/integrantes`) - Com upload de foto e criação de usuário
- ✅ **CRUD Rachas** (`/admin/rachas`) - Ger enciamento completo
- ✅ **API route de criação de usuário** (`/api/admin/create-user`)

---

## 🚀 Como Rodar o Projeto

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Supabase

#### 2.1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Aguarde a inicialização (alguns minutos)

#### 2.2. Executar Migrations

No dashboard do Supabase, vá em **SQL Editor** e execute **na ordem**:

1. **001_initial_schema.sql**
   - Cria todas as 12 tabelas
   - Cria enums, indexes, functions, triggers
   
2. **002_rls_policies.sql**
   - Habilita RLS em todas as tabelas
   - Cria policies por role
   
3. **seed.sql** (opcional)
   - Insere dados de exemplo

#### 2.3. Criar Bucket para Fotos

No dashboard do Supabase:
1. Vá em **Storage**
2. Clique em **New bucket**
3. Nome: `photos`
4. Marque como **Public**

### 3. Configurar Variáveis de Ambiente

Crie `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

**Onde encontrar as chaves:**
- Dashboard do Supabase → **Settings** → **API**
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** (⚠️ secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Criar Primeiro Admin

#### Opção 1: Via Supabase Dashboard
1. Vá em **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Digite e-mail e senha
4. Copie o UUID do usuário criado
5. Vá em **SQL Editor** e execute:

```sql
-- Primeiro, crie um member para o admin
INSERT INTO members (name, email, position) VALUES ('Admin', 'admin@rachaldeira.com', 'Administrador');

-- Copie o ID do member criado e use abaixo
UPDATE profiles 
SET role = 'admin', member_id = 'UUID-DO-MEMBER-AQUI'
WHERE id = 'UUID-DO-USER-AQUI';
```

#### Opção 2: Via /signup (Recomendado)
1. Rode o projeto: `npm run dev`
2. Acesse `http://localhost:3000/signup`
3. Crie uma conta
4. No Supabase Dashboard → **Authentication** → **Users**, copie o UUID
5. Execute o SQL acima para promover a admin

### 5. Rodar o Servidor

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 📋 Próximos Passos (Para Você ou Outro Dev)

### Alta Prioridade

1. **Scouts ao Vivo** (`/admin/rachas/[id]/scouts`)
   - Tabela editável com apenas confirmados
   - Botões: Iniciar / Fechar scouts
   - Atualização em tempo real
   - Ao fechar: status do racha → 'closed'

2. **Detalhes do Racha** (`/rachas/[id]`)
   - Exibir scouts se fechado
   - botão "Ver Scouts" se admin

3. **Estatísticas 2026** (`/stats/2026`)
   - Query agregada de `racha_scouts` + `match_player_stats`
   - Tabela com totais
   - Top 3 por categoria

4. **Ranking** (`/rank`)
   - Filtro: semanal/mensal/anual
   - Badges calculadas dinamicamente
   - Votação Craque/Xerife (se admin abriu período)

### Média Prioridade

5. **CRUD Campeonatos** (`/admin/campeonatos`)
   - Criar campeonato
   - Adicionar times
   - Gerar partidas (pontos corridos ou chaveamento)

6. **Detalhes Campeonato** (`/campeonatos/[id]`)
   - Tabela de classificação (pontos corridos)
   - Bracket visual (chaveamento)
   - Registrar resultados

### Baixa Prioridade (Nice to Have)

7. **Automações**
   - Edge Function: travar racha 30min antes
   - Edge Function: reabrir racha semanal toda segunda
   - Cron jobs no Supabase

8. **Melhorias de UX**
   - Loading states
   - Toast notifications
   - Validação de formulários melhorada
   - Confirmações antes de deletar

9. **Features Extras**
   - Feed do Instagram integrado
   - Notificações push
   - Exportar estatísticas para PDF
   - Gráficos de performance

---

## 🐛 Troubleshooting

### Erro de Autenticação
- Verifique se as chaves no `.env.local` estão corretas
- Certifique-se de que o Supabase está rodando

### Erro de RLS
- Verifique se executou `002_rls_policies.sql`
- Confirme que o usuário tem `role = 'admin'` na tabela `profiles`

### Upload de Foto Não Funciona
- Verifique se criou o bucket `photos` no Supabase Storage
- Confirme que o bucket está marcado como **Public**

### Middleware Bloqueando Rotas
- Verifique que o usuário está autenticado
- Para rotas `/admin/*`, confirme que `profile.role = 'admin'`

---

## 📚 Documentação Adicional

- **README.md** - Instruções gerais e funcionalidades
- **SCHEMA.md** - Documentação completa do banco de dados
- **implementation_plan.md** - Plano técnico detalhado
- **walkthrough.md** - Progresso do desenvolvimento

---

## 🎯 Resumo Executivo

**Status Atual**: ~45% completo

**Funciona agora**:
- ✅ Autenticação
- ✅ CRUD de integrantes (com criação de usuário)
- ✅ CRUD de rachas
- ✅ Confirmação de presença no próximo racha
- ✅ Listagem de integrantes e rachas

**Falta implementar**:
- ⏳ Scouts ao vivo
- ⏳ Campeonatos completos
- ⏳ Estatísticas e ranking
- ⏳ Automações

**Tempo estimado para conclusão**: 10-15 horas de desenvolvimento

---

Desenvolvido para Rachaldeira ⚽
