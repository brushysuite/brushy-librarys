# React Component Injection

`@brushy/di` provides specific functionalities for React component injection, enabling the creation of modular and extensible UI systems.

## Available Functions

- `useInjectComponent`: Injects a React component from the container
- `registerComponent`: Registers a React component in the container
- `createComponentsProvider`: Creates a provider to register multiple components

## useInjectComponent

The `useInjectComponent` function allows injecting React components from the DI container.

### Import

```typescript
import { useInjectComponent } from "@brushy/di";
```

### Basic Usage

```tsx
// Define token for the component
const BUTTON_COMPONENT = "BUTTON_COMPONENT";

// Inject the component
const Button = useInjectComponent(BUTTON_COMPONENT);

// Use the injected component
function App() {
  return (
    <div>
      <h1>My App</h1>
      <Button variant="primary">Click Here</Button>
    </div>
  );
}
```

### With Fallback

```tsx
// Default component if token is not registered
const DefaultButton = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);

// Inject with fallback
const Button = useInjectComponent(BUTTON_COMPONENT, DefaultButton);
```

## registerComponent

The `registerComponent` function registers a React component in the DI container.

### Import

```typescript
import { registerComponent } from "@brushy/di";
```

### Basic Usage

```tsx
// Define token
const BUTTON_COMPONENT = "BUTTON_COMPONENT";

// Component to be registered
const PrimaryButton = ({ children, ...props }) => (
  <button className="primary-button" {...props}>
    {children}
  </button>
);

// Register the component
registerComponent(BUTTON_COMPONENT, PrimaryButton);
```

## createComponentsProvider

The `createComponentsProvider` function creates a React provider that registers multiple components at once.

### Import

```typescript
import { createComponentsProvider } from "@brushy/di";
```

### Basic Usage

```tsx
// Define tokens
const BUTTON_COMPONENT = "BUTTON_COMPONENT";
const CARD_COMPONENT = "CARD_COMPONENT";
const INPUT_COMPONENT = "INPUT_COMPONENT";

// Components
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

// Create provider
const UIComponentsProvider = createComponentsProvider({
  [BUTTON_COMPONENT]: Button,
  [CARD_COMPONENT]: Card,
  [INPUT_COMPONENT]: Input,
});

// Use the provider
function App() {
  return (
    <UIComponentsProvider>
      <YourApp />
    </UIComponentsProvider>
  );
}
```

## Server Components Compatibility

The component injection functions are compatible with React Server Components:

- `useInjectComponent` works both on client and server
- `registerComponent` can be used in any context
- `createComponentsProvider` is optimized for Server Components

## Complete Example: Extensible UI System

```tsx
import {
  Container,
  BrushyDIProvider,
  useInjectComponent,
  registerComponent,
  createComponentsProvider,
} from "@brushy/di";

// Tokens for components
const BUTTON = Symbol("BUTTON");
const CARD = Symbol("CARD");
const MODAL = Symbol("MODAL");
const THEME_PROVIDER = Symbol("THEME_PROVIDER");

// Default components
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

// Create container
const container = new Container();

// Register default components
container.register(BUTTON, { useValue: DefaultButton });
container.register(CARD, { useValue: DefaultCard });
container.register(MODAL, { useValue: DefaultModal });
container.register(THEME_PROVIDER, { useValue: DefaultThemeProvider });

// Injected components
const Button = useInjectComponent(BUTTON);
const Card = useInjectComponent(CARD);
const Modal = useInjectComponent(MODAL);
const ThemeProvider = useInjectComponent(THEME_PROVIDER);

// Application
function App() {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <BrushyDIProvider container={container}>
      <ThemeProvider>
        <div className="app">
          <h1>Extensible UI System</h1>

          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>

          <Card title="Example Card">
            This is an example card injected from the DI container.
          </Card>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            title="Example Modal"
          >
            This is an example modal injected from the DI container.
          </Modal>
        </div>
      </ThemeProvider>
    </BrushyDIProvider>
  );
}

// Custom theme
const CustomThemeProvider = ({ children }) => (
  <div className="dark-theme">{children}</div>
);

// Provider to override default components
const CustomUIProvider = createComponentsProvider({
  [THEME_PROVIDER]: CustomThemeProvider,
  // Could override other components here
});

// Application with custom theme
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
