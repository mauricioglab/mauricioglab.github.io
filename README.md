

## Archivos idénticos en los dos portales (Mauricio y Fernanda)
Los repos son independientes, pero estos archivos deben mantenerse **iguales** en ambos. Si se cambia uno, copiarlo al otro:
- `src/styles/personal-profile.css` (plantilla visual) y `src/styles/admin.css` (panel).
- `src/components/admin/AdminShell.tsx` (login, menú y módulos), `AbmResource.tsx` (ABM genérico), `CasesModule.tsx`, `BlogModule.tsx`, `SocialsEditor.tsx`, `SectionsEditor.tsx`, `shared/WizardModal.tsx`, `shared/BusyOverlay.tsx`.
- Modelo de casos: `src/data/case-model.ts`, `src/data/case-templates.ts`, `CaseModal.astro`, `CaseBlock.astro`.
- Lectores con valores por defecto: `content.ts` (textos) y `portal-data.ts` (galería, menú, ajustes; proyectos en Mauricio).

Cada sitio define sus módulos del panel en `src/components/admin/AdminApp.tsx` y sus recursos editables en `src/data/admin-resources.ts`.
