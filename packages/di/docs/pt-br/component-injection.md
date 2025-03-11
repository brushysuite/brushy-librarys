# Injeção de Componentes React

O `@brushy/di` oferece funcionalidades específicas para injeção de componentes React, permitindo a criação de sistemas de UI modulares e extensíveis.

## Funções Disponíveis

- `useInjectComponent`: Injeta um componente React do container
- `registerComponent`: Registra um componente React no container
- `createComponentsProvider`: Cria um provider para registrar múltiplos componentes

## useInjectComponent

A função `useInjectComponent` permite injetar componentes React do container DI.

### Importação

```typescript
import { useInjectComponent } from "@brushy/di";
```

### Uso Básico

```tsx
// Definir token para o componente
const BUTTON_COMPONENT = "BUTTON_COMPONENT";

// Injetar o componente
const Button = useInjectComponent(BUTTON_COMPONENT);

// Usar o componente injetado
function App() {
  return (
    <div>
      <h1>Meu App</h1>
      <Button variant="primary">Clique Aqui</Button>
    </div>
  );
}
```

### Com Fallback

```tsx
// Componente padrão caso o token não esteja registrado
const DefaultButton = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);

// Injetar com fallback
const Button = useInjectComponent(BUTTON_COMPONENT, DefaultButton);
```

## registerComponent

A função `registerComponent` registra um componente React no container DI.

### Importação

```typescript
import { registerComponent } from "@brushy/di";
```

### Uso Básico

```tsx
// Definir token
const BUTTON_COMPONENT = "BUTTON_COMPONENT";

// Componente a ser registrado
const PrimaryButton = ({ children, ...props }) => (
  <button className="primary-button" {...props}>
    {children}
  </button>
);

// Registrar o componente
registerComponent(BUTTON_COMPONENT, PrimaryButton);
```

## createComponentsProvider

A função `createComponentsProvider` cria um provider React que registra múltiplos componentes de uma vez.

### Importação

```typescript
import { createComponentsProvider } from "@brushy/di";
```

### Uso Básico

```tsx
// Definir tokens
const BUTTON_COMPONENT = "BUTTON_COMPONENT";
const CARD_COMPONENT = "CARD_COMPONENT";
const INPUT_COMPONENT = "INPUT_COMPONENT";

// Componentes
const Button = ({ children, ...props }) => (
  <button className="custom-button" {...props}>
    {children}
  </button>
);

const Card = ({ title, children }) => (
  <div className="card">
    <div className="card-header">{title}</div>
    <div className="card-body">{children}</div>
  </div>
);

const Input = (props) => <input className="custom-input" {...props} />;

// Criar provider
const UIComponentsProvider = createComponentsProvider({
  [BUTTON_COMPONENT]: Button,
  [CARD_COMPONENT]: Card,
  [INPUT_COMPONENT]: Input,
});

// Usar o provider
function App() {
  return (
    <UIComponentsProvider>
      <YourApp />
    </UIComponentsProvider>
  );
}
```

## Compatibilidade com Server Components

As funções de injeção de componentes são compatíveis com React Server Components:

- `useInjectComponent` funciona tanto no cliente quanto no servidor
- `registerComponent` pode ser usado em qualquer contexto
- `createComponentsProvider` é otimizado para Server Components

## Exemplo Completo: Sistema de UI Extensível

```tsx
import {
  Container,
  BrushyDIProvider,
  useInjectComponent,
  registerComponent,
  createComponentsProvider,
} from "@brushy/di";

// Tokens para componentes
const BUTTON = Symbol("BUTTON");
const CARD = Symbol("CARD");
const MODAL = Symbol("MODAL");
const THEME_PROVIDER = Symbol("THEME_PROVIDER");

// Componentes padrão
const DefaultButton = ({ children, variant = "default", ...props }) => (
  <button className={`btn btn-${variant}`} {...props}>
    {children}
  </button>
);

const DefaultCard = ({ title, children, ...props }) => (
  <div className="card" {...props}>
    {title && <div className="card-header">{title}</div>}
    <div className="card-body">{children}</div>
  </div>
);

const DefaultModal = ({ isOpen, onClose, title, children }) =>
  isOpen ? (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  ) : null;

const DefaultThemeProvider = ({ children }) => (
  <div className="default-theme">{children}</div>
);

// Criar container
const container = new Container();

// Registrar componentes padrão
container.register(BUTTON, { useValue: DefaultButton });
container.register(CARD, { useValue: DefaultCard });
container.register(MODAL, { useValue: DefaultModal });
container.register(THEME_PROVIDER, { useValue: DefaultThemeProvider });

// Componentes injetados
const Button = useInjectComponent(BUTTON);
const Card = useInjectComponent(CARD);
const Modal = useInjectComponent(MODAL);
const ThemeProvider = useInjectComponent(THEME_PROVIDER);

// Aplicação
function App() {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <BrushyDIProvider container={container}>
      <ThemeProvider>
        <div className="app">
          <h1>Sistema de UI Extensível</h1>

          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Abrir Modal
          </Button>

          <Card title="Exemplo de Card">
            Este é um exemplo de card injetado do container DI.
          </Card>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            title="Exemplo de Modal"
          >
            Este é um exemplo de modal injetado do container DI.
          </Modal>
        </div>
      </ThemeProvider>
    </BrushyDIProvider>
  );
}

// Tema personalizado
const CustomThemeProvider = ({ children }) => (
  <div className="dark-theme">{children}</div>
);

// Provider para substituir componentes padrão
const CustomUIProvider = createComponentsProvider({
  [THEME_PROVIDER]: CustomThemeProvider,
  // Poderia substituir outros componentes aqui
});

// Aplicação com tema personalizado
function CustomApp() {
  return (
    <BrushyDIProvider container={container}>
      <CustomUIProvider>
        <App />
      </CustomUIProvider>
    </BrushyDIProvider>
  );
}
```
