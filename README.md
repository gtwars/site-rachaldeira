# Rachaldeira - Sistema de Gestão de Racha de Futebol ⚽

Sistema completo para gestão de um único racha de futebol, desenvolvido com Next.js, TailwindCSS, Lucide React e Supabase.

## 🚀 Funcionalidades

### Para Todos os Usuários
- ✅ Autenticação (Login/Cadastro/Recuperação de senha)
- ✅ Visualizar integrantes do racha
- ✅ Confirmar presença nos rachas ("Estou dentro" / "Estou fora")
- ✅ Acompanhar estatísticas dos rachas
- ✅ Ver campeonatos e classificações
- ✅ Ranking com badges automáticas
- ✅ Votar em Craque e Xerife (quando votação aberta)

### Para Administradores
- ✅ Cadastrar e gerenciar integrantes
- ✅ Criar e gerenciar rachas (recorrentes ou únicos)
- ✅ Registrar scouts ao vivo (gols, assistências, defesas, advertências)
- ✅ Criar e gerenciar campeonatos (pontos corridos ou chaveamento)
- ✅ Registrar resultados de partidas
- ✅ Abrir/fechar períodos de votação

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Git (opcional)

## 🔧 instalação e Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. No dashboard do Supabase, vá em **SQL Editor**
3. Execute os seguintes arquivos SQL na ordem:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/seed.sql` (opcional, para dados de exemplo)

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

**Como obter as chaves:**
1. No dashboard do Supabase, vá em **Settings** > **API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (⚠️ secret) → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Criar Primeiro Admin

Após executar as migrations:

1. Crie uma conta pelo `/signup`
2. No Supabase Dashboard, vá em **Authentication** > **Users**
3. Copie o UUID do usuário criado
4. No **SQL Editor**, execute:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'SEU-UUID-AQUI';
```

### 5. Rodar o Projeto

```bash
npm run dev
```


Acesse: [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
Site Rachaldeira/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Páginas de autenticação
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── admin/                 # Páginas administrativas
│   │   ├── integrantes/
│   │   ├── rachas/
│   │   └── campeonatos/
│   ├── rachas/                # Rachas (usuários)
│   ├── campeonatos/           # Campeonatos (usuários)
│   ├── integrantes/           # Lista de integrantes
│   ├── stats/                 # Estatísticas
│   ├── rank/                  # Ranking e votação
│   └── page.tsx               # Home
├── components/                # Componentes React
│   ├── ui/                    # Componentes UI base
│   └── layout/                # Navbar, Footer, etc
├── lib/                       # Utilidades
│   └── supabase/              # Cliente Supabase
├── supabase/                  # SQL migrations e seeds
│   ├── migrations/
│   └── seed.sql
└── public/                    # Arquivos estáticos
```

## 🗄️ Schema do Banco de Dados

### Principais Tabelas

- **profiles** - Perfis de usuário (role: admin/user)
- **members** - Integrantes do racha
- **rachas** - Eventos de racha
- **racha_attendance** - Confirmação de presença
- **racha_scouts** - Estatísticas por racha
- **championships** - Campeonatos
- **teams** - Times dos campeonatos
- **championship_matches** - Partidas
- **match_player_stats** - Estatísticas por partida
- **voting_periods** - Períodos de votação
- **votes** - Votos de Craque/Xerife

Ver documentação completa em `SCHEMA.md`.

## 🔐 Permissões (RLS)

- **Leitura**: Todos os usuários autenticados podem ler dados
- **Escrita**:
  - Usuários podem confirmar própria presença nos rachas
  - Usuários podem votar 1x por período
  - **Apenas admins** podem criar/editar rachas, campeonatos, scouts e integrantes

## 🤖 Automações

### 1. Travar Inscrições (30min antes)
- **Implementação**: Supabase Edge Function com cron
- **Frequência**: A cada 5 minutos
- **Ação**: Muda status de 'open' para 'locked' quando faltar 30min

### 2. Reabrir Racha Semanal
- **Implementação**: Supabase Edge Function com cron
- **Frequência**: Toda segunda-feira às 00:00
- **Ação**: Reabre confirmação do próximo racha semanal

Ver arquivos em `supabase/functions/`.

## 📊 Badges Automáticas

Calculadas dinamicamente por queries agregadas:

- 🎯 **Artilheiro** - Mais gols no período
- 🍽️ **Garçom** - Mais assistências
- 🧱 **Paredão** - Mais defesas difíceis
- 🏃 **Fominha** - Mais participações em rachas
- ⭐ **Craque** - Mais votos "Craque"
- 👮 **Xerife** - Mais votos "Xerife"

## 🚀 Deploy

### Vercel + Supabase

1. Faça push do código para GitHub
2. Importe o projeto no [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente no Vercel
4. Deploy automático!

## 📝 Rotas Principais

### Públicas
- `/` - Home
- `/login` - Login
- `/signup` - Cadastro

### Autenticadas
- `/integrantes` - Lista de integrantes
- `/rachas` - Lista de rachas
- `/rachas/proximo` - Próximo racha (confirmação)
- `/rachas/[id]` - Detalhes do racha
- `/campeonatos` - Lista de campeonatos
- `/campeonatos/[id]` - Detalhes do campeonato
- `/stats/2026` - Estatísticas do ano
- `/rank` - Ranking e votação

### Admin
- `/admin/integrantes` - Gerenciar integrantes
- `/admin/rachas` - Gerenciar rachas
- `/admin/rachas/[id]/scouts` - Scouts ao vivo
- `/admin/campeonatos` - Gerenciar campeonatos

## 🛠️ Tecnologias

- **Framework**: Next.js 15 (App Router)
- **Estilização**: TailwindCSS
- **Ícones**: Lucide React
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Linguagem**: TypeScript

## 📄 Licença

Este projeto foi desenvolvido para uso do grupo Rachaldeira.

## 🤝 Contribuindo

Este é um projeto privado do grupo Rachaldeira. Para sugestões de melhorias, entre em contato com os administradores.

---

Desenvolvido com ⚽ para Rachaldeira
