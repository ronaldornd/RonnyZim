<plan>
  <task id="task_a" title="Refatoração de Fetch (Server Actions)">
    <action description="Criar web/app/actions/profile.ts implementando getProfileData e updateUserXP com revalidateTag/updateTag do Next.js 16" effort="Max" />
    <action description="Refatorar IdentityMatrix.tsx para receber dados via props e remover useEffect de carregamento inicial" effort="Max" />
    <action description="Atualizar web/app/os/page.tsx para buscar dados no servidor e passar para o IdentityMatrix" effort="Max" />
    <verify description="Confirmar que os dados do perfil carregam via SSR sem flashes de conteúdo vazio no cliente" />
  </task>

  <task id="task_b" title="Streaming & Suspense Boundaries">
    <action description="Criar web/components/ui/HolographicFallback.tsx com animação textual [ FETCHING NEURAL DATA... ]" effort="Max" />
    <action description="Implementar Suspense Boundary em web/app/os/page.tsx envolvendo a seção da Matriz de Identidade" effort="Max" />
    <verify description="Validar se o fallback holográfico aparece durante o streaming de dados pesados" />
  </task>

  <task id="task_c" title="Mutação Optimística & Glitch Rollback">
    <action description="Implementar useOptimistic em IdentityMatrix.tsx para XP e Level" effort="Max" />
    <action description="Adicionar efeito de GLITCH vermelho via Framer Motion e mensagem [ UPLINK FAILED ] em caso de erro na Action" effort="Max" />
    <verify description="Validar feedback visual em 0ms e comportamento de rollback com efeito de glitch em erro simulado" />
  </task>

  <done description="Fase 4 - Matriz de Identidade Otimizada com Next.js 16.1 e React 19" />
</plan>
