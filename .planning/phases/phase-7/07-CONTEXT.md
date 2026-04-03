# 07-CONTEXT.md :: Deploy Global & Production Staging

## 1. Decisões de Arquitetura de Deploy
Preparamos a infraestrutura para subida na Vercel (Frontend/Actions) e Supabase (DB/Auth).

- **Hosting**: Vercel (Staging/MVP inicial via `.vercel.app`).
- **Timeout Protocol**: Injetado `maxDuration = 180` no `app/actions/hunter.ts` para todas as ações mutáveis pesadas (áudio/scanning).
- **Auth Lock**: Os Cookies de sessão estão configurados para persistência SSR.

## 2. Environment Vault (Checklist Obrigatório)
Variáveis que DEVEM ser configuradas no painel da Vercel:

| Key | Value Source | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings > API | Client connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings > API | Client public access |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings > API | Server-side elevated access |
| `GEMINI_API_KEY` | Google AI Studio | Neural Engine (Hunter Board/Simulator) |
| `TAVILY_API_KEY` | Tavily Dashboard | Market Intelligence (Job Scanning) |

## 3. Supabase Configuration (Redirects)
No console do Supabase (`Authentication` > `URL Configuration`):
- **Site URL**: `https://{APP_NAME}.vercel.app`
- **Redirect URIs**:
    - `https://{APP_NAME}.vercel.app/auth/callback`
    - `http://localhost:3000/auth/callback` (Keep for Dev)

## 4. Próxima Ação
Após o build local passar, realizaremos o commit de transição e o arquivamento da Milestone 6.0.
Status: [ EM VALIDAÇÃO DE BUILD ]
