# Contributing to Brushy Suite

First off, thank you for considering contributing to Brushy Suite! It's people like you that make Brushy Suite such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* A clear and descriptive title
* A detailed description of the proposed functionality
* Explain why this enhancement would be useful
* List any additional requirements

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code lints
5. Update the documentation

## Development Process

1. Clone the repository
```bash
git clone https://github.com/your-username/brushy.git
cd brushy
```

2. Install dependencies
```bash
npm install
```

3. Create a new branch
```bash
git checkout -b feature/your-feature-name
```

4. Make your changes and ensure tests pass
```bash
npm run test
npm run test:coverage
```

5. Commit your changes following our commit message conventions
```bash
git commit -m "feat(scope): description"
```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Changes that do not affect the meaning of the code
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance
* `test`: Adding missing tests or correcting existing tests
* `chore`: Changes to the build process or auxiliary tools

### Testing Guidelines

- Write test cases for all new features
- Maintain test coverage above 95%
- Use meaningful test descriptions
- Follow the existing test patterns

```typescript
describe('MyFeature', () => {
  it('should handle specific case', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = ...;
    
    // Assert
    expect(result).toBe(...);
  });
});
```

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier configurations provided
- Keep functions small and focused
- Write meaningful comments
- Use descriptive variable names

### Documentation

- Update README.md if needed
- Document all public APIs
- Include JSDoc comments for TypeScript code
- Update examples if relevant

## Project Structure

```
brushy/
├── packages/
│   ├── di/                 # Dependency Injection package
│   └── localstorage/      # LocalStorage package
├── apps/                   # Example applications
├── docs/                   # Documentation
└── tests/                 # Common test utilities
```

## Getting Help

If you need help, you can:

- Open an issue with your question
- Join our [Discord community](https://discord.gg/brushy)
- Check our [documentation](https://brushy.dev/docs)

## License

By contributing, you agree that your contributions will be licensed under the MIT License. 