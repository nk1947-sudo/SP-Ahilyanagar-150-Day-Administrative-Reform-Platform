# Contributing to AhilyangarWorkflow

Thank you for considering contributing to AhilyangarWorkflow! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. By participating in this project, you agree to abide by its terms.

Please report unacceptable behavior to support@wildrexsolutions.com.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork to your local machine
3. Set up the development environment (see [Development Setup](#development-setup))
4. Create a new branch for your changes (see [Branching Strategy](#branching-strategy))
5. Make your changes and commit them (see [Commit Guidelines](#commit-guidelines))
6. Push your changes to your fork
7. Submit a pull request to the main repository

## Development Setup

1. Install Node.js (v18 or higher)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your settings
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Branching Strategy

We follow a branching strategy based on feature branches:

- `main`: Production-ready code
- `dev`: Development branch for integration
- `feature/feature-name`: Feature branches for new features
- `fix/issue-name`: Fix branches for bug fixes
- `hotfix/issue-name`: Hotfix branches for urgent production fixes

Always create your feature or fix branch from the `dev` branch:

```bash
git checkout dev
git pull
git checkout -b feature/your-feature-name
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

Format: `type(scope): description`

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process, dependencies, etc.

Examples:
- `feat(auth): add multi-factor authentication`
- `fix(documents): fix file upload error handling`
- `docs(api): update API documentation`

## Pull Request Process

1. Ensure your code passes all tests
2. Update the documentation if necessary
3. Add a description to your pull request explaining the changes
4. Link to any related issues using the GitHub issue reference syntax
5. Request a review from at least one team member
6. Address any requested changes
7. Once approved, your pull request will be merged

## Coding Standards

### JavaScript/TypeScript

- Use TypeScript for type safety
- Follow the ESLint configuration in the project
- Use async/await for asynchronous operations
- Write meaningful variable and function names
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPERCASE for constants

### React Components

- Use functional components with hooks
- Use the component folder structure:
  ```
  ComponentName/
  ├── index.ts
  ├── ComponentName.tsx
  ├── ComponentName.css (if not using CSS-in-JS)
  └── ComponentName.test.tsx
  ```
- Export components as the default export from their directory

### API Routes

- Use RESTful principles for API design
- Group routes by resource
- Include proper error handling and validation
- Document new routes in the API documentation

## Testing Guidelines

- Write tests for all new features and bug fixes
- Aim for high test coverage, especially for critical paths
- Test both success and failure cases
- Run tests locally before submitting a pull request

Running tests:
```bash
npm test
```

## Documentation

- Update relevant documentation when making changes
- Document all new features, APIs, and configuration options
- Use clear, concise language
- Include examples where appropriate

## Issue Reporting

When reporting issues, please include:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots or error logs if applicable
6. Environment information (browser, OS, version)
7. Any additional context

Thank you for contributing to AhilyangarWorkflow!
