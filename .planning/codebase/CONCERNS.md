# Concerns: RonnyZim OS

Riscos identificados, dívidas e considerações futuras.

## 1. Performance de Animações
A alta dependência de `Framer Motion` (especialmente `layoutId`) pode causar quedas de frame em dispositivos menos potentes se houver muitos elementos animados simultaneamente.
- **Risco**: Degradação da experiência Mystic-Cyber para "Laggy-Cyber".
- **Mitigação**: Otimizar renderização condicional e limitar o escopo de `AnimatePresence`.

## 2. Densidade Visual (No-Scroll)
A diretriz de não utilizar rolagem vertical impõe um limite rígido de conteúdo por visualização. 
- **Risco**: Informações cruciais podem ser "escondidas" demais em abas ou paginação.
- **Mitigação**: Focar em curadoria algorítmica (IA) para mostrar apenas o que é mais relevante no momento.

## 3. Dependência de Modelos de IA
O sistema é altamente centrado no Google Gemini. 
- **Risco**: Latência de API ou mudanças bruscas de comportamento do modelo podem afetar a lógica central do Oráculo.
- **Mitigação**: Implementar camadas de "Prompt Engineering" robustas e fallbacks locais sempre que possível.

## 4. Segurança & RLS
Com a transição para o Supabase, as políticas de segurança de linha (RLS) tornam-se críticas.
- **Risco**: Vazamento de dados de alvos (HunterBoard) entre identidades de usuários.
- **Mitigação**: Auditorias de segurança semanais usando `security_scan.py` e revisão manual de políticas de SQL.

## 5. Próximo Passo: MCP & Integrations
A arquitetura precisa ser flexível o suficiente para integrar novos MCP Servers sem refatorar o núcleo da UI.
- **Risco**: Acoplamento excessivo entre a UI do Oráculo e APIs proprietárias.
- **Mitigação**: Utilizar padrões de adaptador/repositório em `lib/oracle`.
