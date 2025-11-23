# Trading Station - Technology Stack & Dependencies

## 1. Backend Technology Stack

### 1.1 Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| .NET | 8.0 | Runtime framework |
| ASP.NET Core | 8.0 | Web API framework |
| C# | 12.0 | Programming language |

### 1.2 NuGet Packages - API Layer

#### TradingStation.API
```xml
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
<PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
<PackageReference Include="Serilog.Sinks.Console" Version="5.0.1" />
<PackageReference Include="Serilog.Sinks.File" Version="5.0.0" />
<PackageReference Include="Microsoft.AspNetCore.SignalR" Version="1.1.0" />
<PackageReference Include="Microsoft.AspNetCore.Cors" Version="2.2.0" />
```

### 1.3 NuGet Packages - Application Layer

#### TradingStation.Application
```xml
<PackageReference Include="AutoMapper" Version="12.0.1" />
<PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.1" />
<PackageReference Include="FluentValidation" Version="11.9.0" />
<PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="11.9.0" />
<PackageReference Include="MediatR" Version="12.2.0" />
<PackageReference Include="MediatR.Extensions.Microsoft.DependencyInjection" Version="11.1.0" />
<PackageReference Include="CsvHelper" Version="30.0.1" />
```

### 1.4 NuGet Packages - Domain Layer

#### TradingStation.Domain
```xml
<!-- No external dependencies - pure domain logic -->
```

### 1.5 NuGet Packages - Infrastructure Layer

#### TradingStation.Infrastructure
```xml
<!-- Entity Framework Core -->
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>

<!-- Caching -->
<PackageReference Include="Microsoft.Extensions.Caching.Memory" Version="8.0.0" />

<!-- CSV Parsing -->
<PackageReference Include="CsvHelper" Version="30.0.1" />

<!-- Logging -->
<PackageReference Include="Serilog" Version="3.1.1" />
<PackageReference Include="Serilog.Extensions.Logging" Version="8.0.0" />
```

### 1.6 NuGet Packages - Testing

#### TradingStation.Tests / TradingStation.IntegrationTests
```xml
<PackageReference Include="xunit" Version="2.6.5" />
<PackageReference Include="xunit.runner.visualstudio" Version="2.5.6">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
<PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
<PackageReference Include="Moq" Version="4.20.70" />
<PackageReference Include="FluentAssertions" Version="6.12.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.0" />
<PackageReference Include="Bogus" Version="35.4.0" />
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.0" />
```

## 2. Frontend Technology Stack

### 2.1 Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | 5.3.0 | Type-safe JavaScript |
| Node.js | 18.x LTS | JavaScript runtime |

### 2.2 NPM Packages - Production Dependencies

#### package.json (dependencies)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^9.0.4",
    "@reduxjs/toolkit": "^2.0.1",
    "react-financial-charts": "^2.0.1",
    "d3": "^7.8.5",
    "axios": "^1.6.5",
    "@microsoft/signalr": "^8.0.0",
    "react-router-dom": "^6.21.1",
    "typescript": "^5.3.3",
    "date-fns": "^3.0.6",
    "decimal.js": "^10.4.3",
    "react-select": "^5.8.0",
    "react-datepicker": "^4.25.0",
    "react-toastify": "^9.1.3",
    "classnames": "^2.5.0"
  }
}
```

### 2.3 NPM Packages - Development Dependencies

#### package.json (devDependencies)
```json
{
  "devDependencies": {
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@types/d3": "^7.4.3",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.10",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.17.0",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.1.1",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  }
}
```

### 2.4 Frontend Build Tools
| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 5.0.10 | Build tool & dev server |
| ESLint | 8.56.0 | Code linting |
| Prettier | 3.1.1 | Code formatting |

## 3. Database

### 3.1 Database Server
| Technology | Version | Purpose |
|------------|---------|---------|
| SQL Server | 2019+ | Relational database |
| SQL Server Express | 2019+ | Development database |

### 3.2 Database Tools
| Tool | Purpose |
|------|---------|
| SQL Server Management Studio (SSMS) | Database management |
| Azure Data Studio | Cross-platform database tool |
| EF Core CLI | Migrations and database updates |

## 4. Development Tools

### 4.1 IDEs & Editors
| Tool | Version | Purpose |
|------|---------|---------|
| Visual Studio 2022 | 17.8+ | .NET development |
| Visual Studio Code | Latest | React/TypeScript development |
| Rider | 2023.3+ (Optional) | Alternative .NET IDE |

### 4.2 Version Control
| Tool | Version | Purpose |
|------|---------|---------|
| Git | 2.40+ | Source control |
| GitHub / GitLab | - | Repository hosting |

### 4.3 API Testing
| Tool | Purpose |
|------|---------|
| Postman | API testing |
| Swagger UI | API documentation & testing |
| Insomnia | Alternative API client |

### 4.4 Browser DevTools
| Tool | Purpose |
|------|---------|
| React Developer Tools | React debugging |
| Redux DevTools | Redux state inspection |
| Chrome DevTools | General debugging |

## 5. DevOps & CI/CD

### 5.1 Build & Deployment
| Technology | Purpose |
|------------|---------|
| GitHub Actions | CI/CD pipelines |
| Azure DevOps | Alternative CI/CD |
| Docker | Containerization (optional) |
| Docker Compose | Multi-container orchestration |

### 5.2 Monitoring & Logging
| Technology | Purpose |
|------------|---------|
| Serilog | Structured logging |
| Application Insights | Performance monitoring (Azure) |
| ELK Stack | Alternative logging (Elasticsearch, Logstash, Kibana) |

## 6. Project Structure

### 6.1 Backend Solution Structure
```
TradingStation.sln
├── src/
│   ├── TradingStation.API/              (ASP.NET Core Web API)
│   ├── TradingStation.Application/      (Application Services)
│   ├── TradingStation.Domain/           (Domain Models)
│   └── TradingStation.Infrastructure/   (Data Access, File I/O)
├── tests/
│   ├── TradingStation.UnitTests/
│   ├── TradingStation.IntegrationTests/
│   └── TradingStation.ArchitectureTests/
└── docs/
    └── api/
```

### 6.2 Frontend Project Structure
```
trading-station-web/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/
│   ├── store/
│   ├── services/
│   ├── hooks/
│   ├── models/
│   ├── utils/
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .eslintrc.json
```

## 7. Configuration Files

### 7.1 Backend Configuration

#### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=TradingStationDb;Trusted_Connection=True;MultipleActiveResultSets=true"
  },
  "StockDataPath": "C:\\repos\\StockMastery\\Data",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  }
}
```

#### Directory.Build.props
```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <LangVersion>12.0</LangVersion>
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
```

### 7.2 Frontend Configuration

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
```

#### .eslintrc.json
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "rules": {
    "react/react-in-jsx-scope": "off"
  }
}
```

## 8. Environment Setup

### 8.1 Backend Prerequisites
```bash
# Install .NET 8 SDK
# Download from: https://dotnet.microsoft.com/download/dotnet/8.0

# Verify installation
dotnet --version

# Install EF Core CLI tools
dotnet tool install --global dotnet-ef
```

### 8.2 Frontend Prerequisites
```bash
# Install Node.js 18.x LTS
# Download from: https://nodejs.org/

# Verify installation
node --version
npm --version

# Install pnpm (alternative to npm)
npm install -g pnpm
```

### 8.3 Database Setup
```bash
# Apply migrations
cd TradingStation.API
dotnet ef database update

# Or via Package Manager Console in Visual Studio
Update-Database
```

## 9. Running the Application

### 9.1 Backend
```bash
# Navigate to API project
cd TradingStation.API

# Restore packages
dotnet restore

# Run the API
dotnet run

# API will be available at:
# http://localhost:5000
# https://localhost:5001
```

### 9.2 Frontend
```bash
# Navigate to React project
cd trading-station-web

# Install dependencies
npm install

# Start development server
npm run dev

# App will be available at:
# http://localhost:3000
```

### 9.3 Running Tests
```bash
# Backend tests
dotnet test

# Frontend tests
npm test

# With coverage
npm test -- --coverage
```

## 10. Code Quality Tools

### 10.1 Backend Code Quality
| Tool | Purpose |
|------|---------|
| StyleCop | C# code style enforcement |
| SonarAnalyzer | Code quality & security |
| Roslynator | Additional analyzers |

### 10.2 Frontend Code Quality
| Tool | Purpose |
|------|---------|
| ESLint | JavaScript/TypeScript linting |
| Prettier | Code formatting |
| Husky | Git hooks for pre-commit checks |
| Lint-staged | Run linters on staged files |

## 11. Package Management Commands

### 11.1 Backend
```bash
# Add a NuGet package
dotnet add package PackageName

# Remove a package
dotnet remove package PackageName

# Update all packages
dotnet list package --outdated
dotnet add package PackageName --version x.x.x
```

### 11.2 Frontend
```bash
# Add an npm package
npm install package-name

# Add dev dependency
npm install --save-dev package-name

# Remove a package
npm uninstall package-name

# Update packages
npm update

# Check for outdated packages
npm outdated
```

## 12. Performance Libraries (Optional)

### 12.1 Backend Performance
```xml
<PackageReference Include="BenchmarkDotNet" Version="0.13.12" />
<PackageReference Include="MiniProfiler.AspNetCore.Mvc" Version="4.3.8" />
```

### 12.2 Frontend Performance
```json
{
  "dependencies": {
    "react-window": "^1.8.10",
    "react-virtualized-auto-sizer": "^1.0.24"
  }
}
```

## 13. Documentation Tools

| Tool | Purpose |
|------|---------|
| Swagger/OpenAPI | API documentation |
| Storybook | Component documentation (React) |
| DocFX | .NET documentation generation |
| TSDoc | TypeScript documentation |

## 14. Recommended VS Code Extensions

- C# Dev Kit
- ESLint
- Prettier
- React Developer Tools
- GitLens
- Thunder Client (API testing)
- REST Client
- Docker (if using containers)
