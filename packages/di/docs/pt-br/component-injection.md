# Injeção de Componentes React

O `@brushy/di` suporta **injeção de componentes**: registre UI por token no mesmo `Container` dos serviços e resolva com `useInjectComponent` no shell (temas, white-label, A/B).

## Tokens: Symbol apenas (nunca strings)

Use **`createToken("…")`** ou **`Symbol("…")`**. Nunca use strings literais. Em tempo de execução, `createToken` retorna `Symbol(description)`; cada token é único e evita colisões entre módulos ou bibliotecas.

```typescript
// ✅ Bom: createToken (Symbol + inferência do register / useValue)
const SIDEBAR = createToken("SIDEBAR");

// ✅ OK: Symbol puro quando não precisa dos helpers do createToken
const SIDEBAR = Symbol("SIDEBAR");

// ❌ Evite: strings como token
const SIDEBAR = "SIDEBAR";
```

Prefira **`createToken`** em vez de `Symbol` puro para `container.register` e `useInjectComponent` inferirem tipos a partir do componente registrado.

## Recomendado: registrar no Container

Registre componentes React como qualquer outro provider com **`useValue`** no container. Não é necessário um registro separado.

### Bootstrap declarativo

```typescript
import { Container, createToken } from "@brushy/di/core";
import { AcmeSidebar } from "../themes/acme/acme-sidebar";
import { AcmeHeader } from "../themes/acme/acme-header";

const SIDEBAR = createToken("SIDEBAR");
const HEADER = createToken("HEADER");

export const container = new Container({
  name: "app",
  providers: [
    { provide: SIDEBAR, useValue: AcmeSidebar },
    { provide: HEADER, useValue: AcmeHeader },
  ],
});

export { SIDEBAR, HEADER };
```

### Registro imperativo

`container.register` retorna um token tipado. As props fluem para `useInjectComponent` sem generics extras:

```tsx
const container = new Container();

const BUTTON = container.register(createToken("BUTTON"), {
  useValue: PrimaryButton,
});

function Toolbar() {
  const Button = useInjectComponent(BUTTON);
  return <Button variant="primary">Salvar</Button>;
}
```

Forma equivalente:

```typescript
container.register(BUTTON, { useValue: PrimaryButton });
```

### Inferência de tipos (sem generics manuais)

Na maioria dos casos, não é necessário usar `createToken<React.ComponentType<ButtonProps>>("BUTTON")`. Ao registrar com `useValue`, o TypeScript infere o tipo do componente pela implementação. Esse é o mesmo padrão dos testes em `@brushy/di-react`:

```tsx
const BUTTON = container.register(createToken("BUTTON"), {
  useValue: MockComponent,
});

const Button = useInjectComponent(BUTTON);
// props de Button inferidas a partir de MockComponent
return <Button label="Hello" />;
```

Use generics explícitos no token só quando precisar de um contrato antes da implementação existir (ex.: `tokens.ts` compartilhado entre pacotes de tema).

## useInjectComponent

Resolve um componente do container do `BrushyDIProvider` mais próximo.

### Importação

```typescript
import { useInjectComponent, BrushyDIProvider } from "@brushy/di/react";
```

### Com fallback

```tsx
const Button = useInjectComponent(BUTTON, DefaultButton);
```

Se o token não existir e não houver fallback, no ambiente de desenvolvimento a UI de erro é exibida (DOM no web). No React Native, chame `setInjectComponentErrorRenderer` no bootstrap. Veja [Getting Started](./getting-started.md).

## Helpers opcionais

Esses helpers encapsulam `container.register`. Prefira a API do container para manter consistência com o resto do grafo DI.

| API | Quando usar |
| --- | --- |
| `registerComponent(token, component, container?)` | Atalho pontual |
| `registerComponents(map, container?)` | Registro imperativo em lote |
| `createComponentsProvider(map)` | Provider legado que registra no mount (prefira `BrushyDIProvider` + bootstrap no container) |

## Exemplo completo: shell de UI extensível

```tsx
import { useState } from "react";
import { Container, createToken } from "@brushy/di/core";
import { BrushyDIProvider, useInjectComponent } from "@brushy/di/react";

const DefaultButton = ({
  children,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
  <button className={`btn btn-${variant}`} {...props}>
    {children}
  </button>
);

const DefaultCard = ({
  title,
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) => (
  <div className="card">
    {title ? <div className="card-header">{title}</div> : null}
    <div className="card-body">{children}</div>
  </div>
);

export const container = new Container({ name: "ui" });

const BUTTON = container.register(createToken("BUTTON"), {
  useValue: DefaultButton,
});
const CARD = container.register(createToken("CARD"), { useValue: DefaultCard });

function AppShell() {
  const Button = useInjectComponent(BUTTON);
  const Card = useInjectComponent(CARD);
  const [open, setOpen] = useState(false);

  return (
    <div className="app">
      <Button variant="primary" onClick={() => setOpen(true)}>
        Abrir
      </Button>
      <Card title="Exemplo">Conteúdo injetado do container.</Card>
    </div>
  );
}

export function App() {
  return (
    <BrushyDIProvider container={container}>
      <AppShell />
    </BrushyDIProvider>
  );
}
```

Para trocar tema, substitua imports de componentes em `providers` ou use `container.import` de um container filho. Veja [Best Practices](./best-practices.md).

## Server Components

- Registre componentes no container durante o bootstrap (servidor ou cliente).
- `useInjectComponent` roda em Client Components; use `@brushy/di/core` no servidor para serviços.
