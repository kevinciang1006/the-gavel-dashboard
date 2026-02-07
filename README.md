# The Gavel Dashboard

Oracle-free DeFi lending platform with competitive auctions, market-driven rates, and zero oracle risk.

## Project Info

This is a React-based dashboard for The Gavel Protocol, built with modern web technologies.

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- RainbowKit & wagmi (Web3 integration)
- Framer Motion (animations)

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd the-gavel-dashboard

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── store/          # Zustand state management
├── types/          # TypeScript type definitions
└── main.tsx        # Application entry point
```

## Deployment

Build the project for production:

```sh
npm run build
```

The build output will be in the `dist` directory, ready to be deployed to any static hosting service.
