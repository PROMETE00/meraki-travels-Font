This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## GitHub Copilot CLI

You can use [GitHub Copilot in the CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli/about-github-copilot-in-the-cli) to get AI-powered suggestions directly in your terminal.

### Prerequisites

- [GitHub CLI (`gh`)](https://cli.github.com/) installed and authenticated with a GitHub account that has access to GitHub Copilot.

### Installation

1. Install the GitHub CLI if you haven't already:

   ```bash
   # macOS (Homebrew)
   brew install gh

   # Windows (winget)
   winget install --id GitHub.cli

   # Linux (apt)
   sudo apt install gh
   ```

2. Authenticate with GitHub:

   ```bash
   gh auth login
   ```

3. Install the GitHub Copilot CLI extension:

   ```bash
   gh extension install github/gh-copilot
   ```

4. Verify the installation:

   ```bash
   gh copilot --version
   ```

### Usage

```bash
# Ask a general question
gh copilot explain "git rebase -i HEAD~3"

# Get a shell command suggestion
gh copilot suggest "how do I undo the last git commit"
```

For more details, see the [official documentation](https://docs.github.com/en/copilot/github-copilot-in-the-cli/using-github-copilot-in-the-cli).
