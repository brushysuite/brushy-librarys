import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Container } from "../index";

describe("E2E - Container", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should support layered architecture with multiple dependencies", () => {
    const mockDatabase = {
      users: [
        { id: 1, name: "João Silva", email: "joao@example.com" },
        { id: 2, name: "Maria Souza", email: "maria@example.com" },
      ],
      findUserById: function (id: number) {
        return this.users.find((user) => user.id === id);
      },
      findAllUsers: function () {
        return [...this.users];
      },
      saveUser: function (user: any) {
        const existingIndex = this.users.findIndex((u) => u.id === user.id);
        if (existingIndex >= 0) {
          this.users[existingIndex] = { ...user };
          return user;
        }

        const newUser = { ...user, id: this.users.length + 1 };
        this.users.push(newUser);
        return newUser;
      },
    };

    class UserRepository {
      constructor(private db: typeof mockDatabase) {}

      async findById(id: number) {
        return Promise.resolve(this.db.findUserById(id));
      }

      async findAll() {
        return Promise.resolve(this.db.findAllUsers());
      }

      async save(user: any) {
        return Promise.resolve(this.db.saveUser(user));
      }
    }

    class UserService {
      constructor(
        private userRepository: UserRepository,
        private logger: Logger,
      ) {}

      async getUserById(id: number) {
        this.logger.log(`Fetching user with ID: ${id}`);
        const user = await this.userRepository.findById(id);
        if (!user) {
          this.logger.error(`User with ID ${id} not found`);
          throw new Error(`User not found: ${id}`);
        }
        return user;
      }

      async getAllUsers() {
        this.logger.log("Listing all users");
        return await this.userRepository.findAll();
      }

      async createUser(userData: { name: string; email: string }) {
        this.logger.log(`Creating new user: ${userData.name}`);

        if (!userData.name || !userData.email) {
          this.logger.error("Invalid user data");
          throw new Error("Name and email are required");
        }

        return await this.userRepository.save(userData);
      }
    }

    class Logger {
      constructor(private context: string) {}

      log(message: string) {
        return `[${this.context}] INFO: ${message}`;
      }

      error(message: string) {
        return `[${this.context}] ERROR: ${message}`;
      }
    }

    class UserController {
      constructor(private userService: UserService) {}

      async getUser(id: number) {
        try {
          const user = await this.userService.getUserById(id);
          return { success: true, data: user };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }

      async listUsers() {
        try {
          const users = await this.userService.getAllUsers();
          return { success: true, data: users };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }

      async addUser(userData: { name: string; email: string }) {
        try {
          const newUser = await this.userService.createUser(userData);
          return { success: true, data: newUser };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    }

    const DATABASE = Symbol("DATABASE");
    const USER_REPOSITORY = Symbol("USER_REPOSITORY");
    const LOGGER = Symbol("LOGGER");
    const USER_SERVICE = Symbol("USER_SERVICE");
    const USER_CONTROLLER = Symbol("USER_CONTROLLER");

    container.register(DATABASE, { useValue: mockDatabase });
    container.register(LOGGER, {
      useFactory: () => new Logger("UserModule"),
      lifecycle: "singleton",
    });
    container.register(USER_REPOSITORY, {
      useClass: UserRepository,
      dependencies: [DATABASE],
      lifecycle: "singleton",
    });
    container.register(USER_SERVICE, {
      useClass: UserService,
      dependencies: [USER_REPOSITORY, LOGGER],
    });
    container.register(USER_CONTROLLER, {
      useClass: UserController,
      dependencies: [USER_SERVICE],
    });

    const userController = container.resolve<UserController>(USER_CONTROLLER);

    return userController
      .listUsers()
      .then((result) => {
        expect(result.success).toBe(true);
        if (result.data) {
          expect(result.data).toHaveLength(2);
          expect(result.data[0].name).toBe("João Silva");
        }

        return userController.getUser(1);
      })
      .then((result) => {
        expect(result.success).toBe(true);
        expect(result.data.email).toBe("joao@example.com");

        return userController.addUser({
          name: "Carlos Oliveira",
          email: "carlos@example.com",
        });
      })
      .then((result) => {
        expect(result.success).toBe(true);
        expect(result.data.id).toBe(3);
        expect(result.data.name).toBe("Carlos Oliveira");

        return userController.listUsers();
      })
      .then((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
      });
  });

  it("should support strategy pattern with different implementations", () => {
    interface Notifier {
      send(recipient: string, message: string): Promise<boolean>;
    }

    class EmailNotifier implements Notifier {
      constructor(private emailConfig: { server: string; port: number }) {}

      async send(recipient: string, message: string): Promise<boolean> {
        console.log(
          `Sending email to ${recipient} via ${this.emailConfig.server}:${this.emailConfig.port}`,
        );
        console.log(`Content: ${message}`);
        return Promise.resolve(true);
      }
    }

    class SMSNotifier implements Notifier {
      constructor(private smsConfig: { apiKey: string }) {}

      async send(recipient: string, message: string): Promise<boolean> {
        console.log(
          `Sending SMS to ${recipient} using API key: ${this.smsConfig.apiKey}`,
        );
        console.log(`Content: ${message}`);
        return Promise.resolve(true);
      }
    }

    class PushNotifier implements Notifier {
      constructor(private pushConfig: { appId: string; apiKey: string }) {}

      async send(recipient: string, message: string): Promise<boolean> {
        console.log(
          `Sending push to ${recipient} using App ID: ${this.pushConfig.appId}`,
        );
        console.log(`Content: ${message}`);
        return Promise.resolve(true);
      }
    }

    class NotificationService {
      constructor(
        private emailNotifier: Notifier,
        private smsNotifier: Notifier,
        private pushNotifier: Notifier,
      ) {}

      async notifyUser(
        user: {
          id: number;
          name: string;
          email: string;
          phone?: string;
          deviceToken?: string;
        },
        message: string,
      ): Promise<string[]> {
        const results: string[] = [];

        try {
          const emailResult = await this.emailNotifier.send(
            user.email,
            message,
          );
          if (emailResult) results.push("email");
        } catch (error) {
          console.error("Failed to send email:", error);
        }

        if (user.phone) {
          try {
            const smsResult = await this.smsNotifier.send(user.phone, message);
            if (smsResult) results.push("sms");
          } catch (error) {
            console.error("Failed to send SMS:", error);
          }
        }

        if (user.deviceToken) {
          try {
            const pushResult = await this.pushNotifier.send(
              user.deviceToken,
              message,
            );
            if (pushResult) results.push("push");
          } catch (error) {
            console.error("Failed to send push:", error);
          }
        }

        return results;
      }
    }

    const emailConfig = { server: "smtp.example.com", port: 587 };
    const smsConfig = { apiKey: "sms-api-key-123" };
    const pushConfig = { appId: "app-123", apiKey: "push-api-key-456" };

    const EMAIL_CONFIG = Symbol("EMAIL_CONFIG");
    const SMS_CONFIG = Symbol("SMS_CONFIG");
    const PUSH_CONFIG = Symbol("PUSH_CONFIG");
    const EMAIL_NOTIFIER = Symbol("EMAIL_NOTIFIER");
    const SMS_NOTIFIER = Symbol("SMS_NOTIFIER");
    const PUSH_NOTIFIER = Symbol("PUSH_NOTIFIER");
    const NOTIFICATION_SERVICE = Symbol("NOTIFICATION_SERVICE");

    container.register(EMAIL_CONFIG, { useValue: emailConfig });
    container.register(SMS_CONFIG, { useValue: smsConfig });
    container.register(PUSH_CONFIG, { useValue: pushConfig });

    container.register(EMAIL_NOTIFIER, {
      useClass: EmailNotifier,
      dependencies: [EMAIL_CONFIG],
    });

    container.register(SMS_NOTIFIER, {
      useClass: SMSNotifier,
      dependencies: [SMS_CONFIG],
    });

    container.register(PUSH_NOTIFIER, {
      useClass: PushNotifier,
      dependencies: [PUSH_CONFIG],
    });

    container.register(NOTIFICATION_SERVICE, {
      useClass: NotificationService,
      dependencies: [EMAIL_NOTIFIER, SMS_NOTIFIER, PUSH_NOTIFIER],
    });

    const logSpy = vi.spyOn(console, "log");

    const notificationService =
      container.resolve<NotificationService>(NOTIFICATION_SERVICE);

    const fullUser = {
      id: 1,
      name: "Ana Silva",
      email: "ana@example.com",
      phone: "+5511999999999",
      deviceToken: "device-token-123",
    };

    return notificationService
      .notifyUser(fullUser, "Hello Ana, we have news!")
      .then((results) => {
        expect(results).toContain("email");
        expect(results).toContain("sms");
        expect(results).toContain("push");
        expect(results).toHaveLength(3);

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining("Sending email to ana@example.com"),
        );
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining("Sending SMS to +5511999999999"),
        );
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining("Sending push to device-token-123"),
        );

        const emailOnlyUser = {
          id: 2,
          name: "Carlos Oliveira",
          email: "carlos@example.com",
        };

        return notificationService.notifyUser(
          emailOnlyUser,
          "Hello Carlos, we have news!",
        );
      })
      .then((results) => {
        expect(results).toContain("email");
        expect(results).not.toContain("sms");
        expect(results).not.toContain("push");
        expect(results).toHaveLength(1);
      });
  });

  it("should respect different lifecycles in a real application", async () => {
    let configInstanceCount = 0;
    let loggerInstanceCount = 0;
    let requestHandlerInstanceCount = 0;

    class AppConfig {
      constructor() {
        configInstanceCount++;
      }

      getApiUrl() {
        return "https:";
      }

      getTimeout() {
        return 5000;
      }
    }

    class AppLogger {
      constructor() {
        loggerInstanceCount++;
      }

      log(message: string) {
        return `LOG: ${message}`;
      }
    }

    class RequestHandler {
      constructor(
        private config: AppConfig,
        private logger: AppLogger,
        private requestId: string,
      ) {
        requestHandlerInstanceCount++;
      }

      async processRequest(endpoint: string, data: any) {
        const apiUrl = this.config.getApiUrl();
        const timeout = this.config.getTimeout();

        this.logger.log(
          `Processing request ${this.requestId} to ${apiUrl}/${endpoint}`,
        );
        this.logger.log(`Data: ${JSON.stringify(data)}`);
        this.logger.log(`Timeout: ${timeout}ms`);

        await new Promise((resolve) => setTimeout(resolve, 10));

        return {
          success: true,
          requestId: this.requestId,
          endpoint,
          data,
        };
      }
    }

    const APP_CONFIG = Symbol("APP_CONFIG");
    const APP_LOGGER = Symbol("APP_LOGGER");
    const REQUEST_HANDLER = Symbol("REQUEST_HANDLER");
    const REQUEST_ID = Symbol("REQUEST_ID");

    container.register(APP_CONFIG, {
      useClass: AppConfig,
      lifecycle: "singleton",
    });

    container.register(APP_LOGGER, {
      useClass: AppLogger,
      lifecycle: "singleton",
    });

    const requestIds = ["req-123", "req-456", "req-789"];

    for (const requestId of requestIds) {
      container.register(REQUEST_ID, {
        useValue: requestId,
        lifecycle: "transient",
      });

      container.register(REQUEST_HANDLER, {
        useClass: RequestHandler,
        dependencies: [APP_CONFIG, APP_LOGGER, REQUEST_ID],
        lifecycle: "transient",
      });

      const handler = container.resolve<RequestHandler>(REQUEST_HANDLER);
      await handler.processRequest("users", { action: "list" });
    }

    expect(configInstanceCount).toBe(1);
    expect(loggerInstanceCount).toBe(1);
    expect(requestHandlerInstanceCount).toBe(3);
  });

  it("should reject circular dependencies in a real application", () => {
    class AuthService {
      constructor(private userService: UserService) {}

      validateUser(username: string, password: string) {
        return this.userService
          .findByUsername(username)
          .then((user) => user && user.password === password);
      }
    }

    class UserService {
      constructor(private authService: AuthService) {}

      findByUsername(username: string) {
        if (username === "admin") {
          return Promise.resolve({ username: "admin", password: "admin123" });
        }
        return Promise.resolve(null);
      }

      isAuthenticated(username: string, password: string) {
        return this.authService.validateUser(username, password);
      }
    }

    const AUTH_SERVICE = Symbol("AUTH_SERVICE");
    const USER_SERVICE = Symbol("USER_SERVICE");

    container.register(AUTH_SERVICE, {
      useClass: AuthService,
      dependencies: [USER_SERVICE],
    });

    container.register(USER_SERVICE, {
      useClass: UserService,
      dependencies: [AUTH_SERVICE],
    });

    expect(() => {
      container.resolve(AUTH_SERVICE);
    }).toThrow(/circular dependency/i);
  });
});
