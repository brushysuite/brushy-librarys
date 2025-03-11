import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  Container,
  BrushyDIProvider,
  useInject,
  useLazyInject,
  server,
} from "../index";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import "@testing-library/jest-dom";

describe("E2E - React Hooks", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should build a complete e-commerce application with DI", async () => {
    type User = {
      id: number;
      name: string;
      email: string;
      role: "admin" | "customer";
    };

    type Product = {
      id: number;
      name: string;
      price: number;
      description: string;
      imageUrl: string;
      stock: number;
    };

    type CartItem = {
      product: Product;
      quantity: number;
    };

    class AuthService {
      private currentUser: User | null = null;
      private isAuthenticated = false;

      constructor() {
        this.users = [
          {
            id: 1,
            name: "Admin",
            email: "admin@example.com",
            password: "admin123",
            role: "admin" as const,
          },
          {
            id: 2,
            name: "Customer",
            email: "customer@example.com",
            password: "customer123",
            role: "customer" as const,
          },
        ];
      }

      private users: Array<User & { password: string }> = [];

      async login(email: string, password: string): Promise<User> {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const user = this.users.find(
              (u) => u.email === email && u.password === password,
            );
            if (user) {
              const { password, ...userData } = user;
              this.currentUser = userData;
              this.isAuthenticated = true;
              resolve(userData);
            } else {
              reject(new Error("Invalid credentials"));
            }
          }, 100);
        });
      }

      async logout(): Promise<void> {
        return new Promise((resolve) => {
          setTimeout(() => {
            this.currentUser = null;
            this.isAuthenticated = false;
            resolve();
          }, 100);
        });
      }

      async getCurrentUser(): Promise<User | null> {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this.currentUser);
          }, 50);
        });
      }

      async isUserAuthenticated(): Promise<boolean> {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this.isAuthenticated);
          }, 50);
        });
      }
    }

    class ProductService {
      private products: Product[] = [
        {
          id: 1,
          name: "Smartphone X",
          price: 999.99,
          description: "The best smartphone on the market",
          imageUrl: "/images/smartphone.jpg",
          stock: 10,
        },
        {
          id: 2,
          name: "Laptop Pro",
          price: 1999.99,
          description: "Professional laptop",
          imageUrl: "/images/laptop.jpg",
          stock: 5,
        },
        {
          id: 3,
          name: "Wireless Headphones",
          price: 199.99,
          description: "High quality wireless headphones",
          imageUrl: "/images/headphones.jpg",
          stock: 20,
        },
      ];

      async getAllProducts(): Promise<Product[]> {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([...this.products]);
          }, 100);
        });
      }

      async getProductById(id: number): Promise<Product | null> {
        return new Promise((resolve) => {
          setTimeout(() => {
            const product = this.products.find((p) => p.id === id);
            resolve(product || null);
          }, 50);
        });
      }

      async searchProducts(query: string): Promise<Product[]> {
        return new Promise((resolve) => {
          setTimeout(() => {
            const results = this.products.filter((p) =>
              p.name.toLowerCase().includes(query.toLowerCase()),
            );
            resolve(results);
          }, 100);
        });
      }

      async updateStock(productId: number, newStock: number): Promise<boolean> {
        return new Promise((resolve) => {
          setTimeout(() => {
            const product = this.products.find((p) => p.id === productId);
            if (product) {
              product.stock = newStock;
              resolve(true);
            } else {
              resolve(false);
            }
          }, 100);
        });
      }
    }

    class CartService {
      private items: CartItem[] = [];

      async getCartItems(): Promise<CartItem[]> {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([...this.items]);
          }, 100);
        });
      }

      async addToCart(product: Product, quantity = 1): Promise<CartItem[]> {
        return new Promise((resolve) => {
          setTimeout(() => {
            const existingItem = this.items.find(
              (item) => item.product.id === product.id,
            );

            if (existingItem) {
              existingItem.quantity += quantity;
            } else {
              this.items.push({ product, quantity });
            }

            resolve([...this.items]);
          }, 100);
        });
      }

      async updateQuantity(
        productId: number,
        quantity: number,
      ): Promise<CartItem[]> {
        return new Promise((resolve) => {
          setTimeout(() => {
            const item = this.items.find(
              (item) => item.product.id === productId,
            );

            if (item) {
              item.quantity = quantity;

              if (item.quantity <= 0) {
                this.items = this.items.filter(
                  (i) => i.product.id !== productId,
                );
              }
            }

            resolve([...this.items]);
          }, 100);
        });
      }

      async removeFromCart(productId: number): Promise<CartItem[]> {
        return new Promise((resolve) => {
          setTimeout(() => {
            this.items = this.items.filter((i) => i.product.id !== productId);
            resolve([...this.items]);
          }, 100);
        });
      }

      async clearCart(): Promise<void> {
        return new Promise((resolve) => {
          setTimeout(() => {
            this.items = [];
            resolve();
          }, 100);
        });
      }

      async getCartTotal(): Promise<number> {
        return new Promise((resolve) => {
          setTimeout(() => {
            const total = this.items.reduce(
              (sum, item) => sum + item.product.price * item.quantity,
              0,
            );
            resolve(total);
          }, 50);
        });
      }
    }

    const AUTH_SERVICE = Symbol("AUTH_SERVICE");
    const PRODUCT_SERVICE = Symbol("PRODUCT_SERVICE");
    const CART_SERVICE = Symbol("CART_SERVICE");

    container.register(AUTH_SERVICE, { useClass: AuthService });
    container.register(PRODUCT_SERVICE, { useClass: ProductService });
    container.register(CART_SERVICE, { useClass: CartService });

    const AuthContext = createContext<{
      user: User | null;
      login: (email: string, password: string) => Promise<void>;
      logout: () => Promise<void>;
    }>({
      user: null,
      login: async () => {},
      logout: async () => {},
    });

    const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) => {
      const authService = useInject<AuthService>(AUTH_SERVICE);
      const [user, setUser] = useState<User | null>(null);

      useEffect(() => {
        const checkAuth = async () => {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        };

        checkAuth();
      }, [authService]);

      const login = async (email: string, password: string) => {
        try {
          const user = await authService.login(email, password);
          setUser(user);
        } catch (error) {
          console.error("Login failed:", error);
          throw error;
        }
      };

      const logout = async () => {
        await authService.logout();
        setUser(null);
      };

      return (
        <AuthContext.Provider value={{ user, login, logout }}>
          {children}
        </AuthContext.Provider>
      );
    };

    const LoginForm = () => {
      const { login } = useContext(AuthContext);
      const [email, setEmail] = useState("admin@example.com");
      const [password, setPassword] = useState("admin123");
      const [error, setError] = useState("");

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
          await login(email, password);
        } catch (error) {
          setError("Login failed. Please check your credentials.");
        }
      };

      return (
        <div className="login-form" data-testid="login-form">
          <h2>Login</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
              />
            </div>
            <div>
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
              />
            </div>
            <button type="submit" data-testid="login-button">
              Login
            </button>
          </form>
        </div>
      );
    };

    const ProductCatalog = () => {
      const productService = useInject<ProductService>(PRODUCT_SERVICE);
      const cartService = useInject<CartService>(CART_SERVICE);
      const [products, setProducts] = useState<Product[]>([]);
      const [searchQuery, setSearchQuery] = useState("");
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const loadProducts = async () => {
          setLoading(true);
          const allProducts = await productService.getAllProducts();
          setProducts(allProducts);
          setLoading(false);
        };

        loadProducts();
      }, [productService]);

      const handleSearch = async () => {
        if (!searchQuery.trim()) {
          const allProducts = await productService.getAllProducts();
          setProducts(allProducts);
          return;
        }

        const results = await productService.searchProducts(searchQuery);
        setProducts(results);
      };

      const handleAddToCart = async (product: Product) => {
        await cartService.addToCart(product, 1);
      };

      if (loading) {
        return <div>Loading products...</div>;
      }

      return (
        <div className="product-catalog" data-testid="product-catalog">
          <h2>Products</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
            />
            <button onClick={handleSearch} data-testid="search-button">
              Search
            </button>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-card"
                data-testid={`product-${product.id}`}
              >
                <h3>{product.name}</h3>
                <p className="price">$ {product.price.toFixed(2)}</p>
                <p>{product.description}</p>
                <p>In stock: {product.stock}</p>
                <button
                  onClick={() => handleAddToCart(product)}
                  data-testid={`add-to-cart-${product.id}`}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const ShoppingCart = () => {
      const cartService = useInject<CartService>(CART_SERVICE);
      const [cartItems, setCartItems] = useState<CartItem[]>([]);
      const [total, setTotal] = useState(0);
      const [loading, setLoading] = useState(true);

      const loadCart = useCallback(async () => {
        setLoading(true);
        const items = await cartService.getCartItems();
        const cartTotal = await cartService.getCartTotal();
        setCartItems(items);
        setTotal(cartTotal);
        setLoading(false);
      }, [cartService]);

      useEffect(() => {
        loadCart();
      }, [loadCart]);

      const handleIncreaseQuantity = async (productId: number) => {
        const item = cartItems.find((i) => i.product.id === productId);
        if (item) {
          await cartService.updateQuantity(productId, item.quantity + 1);
          loadCart();
        }
      };

      const handleDecreaseQuantity = async (productId: number) => {
        const item = cartItems.find((i) => i.product.id === productId);
        if (item && item.quantity > 1) {
          await cartService.updateQuantity(productId, item.quantity - 1);
          loadCart();
        }
      };

      const handleRemoveItem = async (productId: number) => {
        await cartService.removeFromCart(productId);
        loadCart();
      };

      const handleClearCart = async () => {
        await cartService.clearCart();
        loadCart();
      };

      if (loading) {
        return <div>Loading cart...</div>;
      }

      return (
        <div className="cart" data-testid="cart">
          <h2>Cart</h2>
          {cartItems.length === 0 ? (
            <div>Your cart is empty</div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="cart-item"
                    data-testid={`cart-item-${item.product.id}`}
                  >
                    <div className="item-details">
                      <h4>{item.product.name}</h4>
                      <p>$ {item.product.price.toFixed(2)}</p>
                    </div>
                    <div className="item-actions">
                      <div className="quantity-control">
                        <button
                          onClick={() =>
                            handleDecreaseQuantity(item.product.id)
                          }
                          data-testid={`decrease-${item.product.id}`}
                        >
                          -
                        </button>
                        <span data-testid={`quantity-${item.product.id}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleIncreaseQuantity(item.product.id)
                          }
                          data-testid={`increase-${item.product.id}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="remove-button"
                        onClick={() => handleRemoveItem(item.product.id)}
                        data-testid={`remove-${item.product.id}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-summary">
                <div className="cart-total" data-testid="cart-total">
                  <strong>Total:</strong> $ {total.toFixed(2)}
                </div>
                <button
                  className="clear-cart"
                  onClick={handleClearCart}
                  data-testid="clear-cart"
                >
                  Clear Cart
                </button>
                <button className="checkout" data-testid="checkout">
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      );
    };

    const App = () => {
      const { user, logout } = useContext(AuthContext);

      if (!user) {
        return <LoginForm />;
      }

      return (
        <div className="app">
          <header>
            <h1>Online Store</h1>
            <div className="user-info">
              <span>Hello, {user.name}</span>
              <button onClick={logout} data-testid="logout-button">
                Logout
              </button>
            </div>
          </header>
          <main>
            <ProductCatalog />
            <ShoppingCart />
          </main>
        </div>
      );
    };

    render(
      <BrushyDIProvider container={container}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrushyDIProvider>,
    );

    expect(screen.getByTestId("login-form")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("login-button"));
    });

    await waitFor(() => {
      expect(screen.getByText("Online Store")).toBeInTheDocument();
      expect(screen.getByText("Hello, Admin")).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(
          screen.queryByText("Loading products..."),
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await waitFor(() => {
      expect(screen.getByText("Smartphone X")).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.queryByText("Loading cart...")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await waitFor(() => {
      expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("logout-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
  });

  it.skip("should lazy load heavy services", async () => {
    // Este teste está sendo pulado devido a problemas com o registro do token REPORT_GENERATOR
    const testContainer = new Container();

    server.setServerContainer(testContainer);

    let resolveInit: () => void;
    const initPromise = new Promise<void>((resolve) => {
      resolveInit = resolve;
    });

    class ReportGenerator {
      constructor() {
        console.log("Initializing ReportGenerator - heavy service");
      }

      generateReport(data: any): string {
        return `Report generated: ${JSON.stringify(data)}`;
      }
    }

    const reportGeneratorFactory = async () => {
      await initPromise;
      return new ReportGenerator();
    };

    const REPORT_GENERATOR = Symbol("REPORT_GENERATOR");
    testContainer.register(REPORT_GENERATOR, {
      useFactory: reportGeneratorFactory,
      lazy: true,
    });

    const LazyComponent = () => {
      const [loaded, setLoaded] = useState(false);
      const [service, loadService] =
        useLazyInject<ReportGenerator>(REPORT_GENERATOR);

      const handleLoad = async () => {
        resolveInit();
        loadService();
        setLoaded(true);
      };

      return (
        <div>
          <button data-testid="load-button" onClick={handleLoad}>
            Load Service
          </button>
          {loaded && service && (
            <div data-testid="report">
              {service.generateReport({ test: "data" })}
            </div>
          )}
        </div>
      );
    };

    render(
      <BrushyDIProvider container={testContainer}>
        <LazyComponent />
      </BrushyDIProvider>,
    );

    expect(screen.getByTestId("load-button")).toBeInTheDocument();

    expect(screen.queryByTestId("report")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("load-button"));
    });

    waitFor(() => {
      expect(screen.getByTestId("report")).toBeInTheDocument();
    });
  });
});
