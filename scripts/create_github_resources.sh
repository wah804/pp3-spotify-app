#!/bin/bash

# Exit immediately if any command fails
set -e

echo "=== Spotify Harmony GitHub Project Setup ==="

# Check if GitHub CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
  echo "Error: 'gh' (GitHub CLI) is not installed."
  echo "Please install it using 'brew install gh' or download it from cli.github.com"
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "Error: You are not authenticated with GitHub CLI."
  echo "Please run 'gh auth login' to authenticate first."
  exit 1
fi

# Try to get the current repo name to check if remote exists
if ! git remote -v | grep -q "github.com"; then
  echo "Warning: No GitHub remote detected. Please push this repository to GitHub before running this script."
  echo "Example:"
  echo "  gh repo create pp3-spotify-app --public --source=. --remote=origin --push"
  exit 1
fi

echo "Adding Milestones via GitHub API..."

# Calculate due dates (macOS compatible `date -v` fallback)
DATE_W1=$(date -v+7d +%Y-%m-%dT23:59:59Z 2>/dev/null || date -d "+7 days" +%Y-%m-%dT23:59:59Z 2>/dev/null || echo "")
DATE_W2=$(date -v+14d +%Y-%m-%dT23:59:59Z 2>/dev/null || date -d "+14 days" +%Y-%m-%dT23:59:59Z 2>/dev/null || echo "")
DATE_W3=$(date -v+21d +%Y-%m-%dT23:59:59Z 2>/dev/null || date -d "+21 days" +%Y-%m-%dT23:59:59Z 2>/dev/null || echo "")
DATE_W4=$(date -v+28d +%Y-%m-%dT23:59:59Z 2>/dev/null || date -d "+28 days" +%Y-%m-%dT23:59:59Z 2>/dev/null || echo "")

create_milestone() {
  local title="$1"
  local desc="$2"
  local due="$3"
  
  if [ -n "$due" ]; then
    gh api --method POST /repos/:owner/:repo/milestones \
      -f title="$title" \
      -f description="$desc" \
      -f due_on="$due" > /dev/null 2>&1 || echo "Milestone '$title' already exists or failed to create."
  else
    gh api --method POST /repos/:owner/:repo/milestones \
      -f title="$title" \
      -f description="$desc" > /dev/null 2>&1 || echo "Milestone '$title' already exists or failed to create."
  fi
}

create_milestone "Milestone 1: Week 1 - Project Scaffolding & Initial Backend" \
  "Initialize repository, write documentation, define backlog, and build backend scaffold." \
  "$DATE_W1"

create_milestone "Milestone 2: Week 2 - Spotify Authentication & API Routing" \
  "Establish secure OAuth2 connection with Spotify and create backend wrapper routes." \
  "$DATE_W2"

create_milestone "Milestone 3: Week 3 - Frontend Integration & Dashboard UI" \
  "Build an elegant user interface to communicate with backend APIs." \
  "$DATE_W3"

create_milestone "Milestone 4: Week 4 - Staging Deployment, Testing & Polish" \
  "Deploy working application, test functionality, and polish UX/UI." \
  "$DATE_W4"

echo "Adding Issues for Milestone 1..."
gh issue create --title "PP3-1.1: Initialize project folder and git repository" \
  --body "Task: Set up the local project folder and initialize a Git repository. Make it a public repository on GitHub." \
  --milestone "Milestone 1: Week 1 - Project Scaffolding & Initial Backend"

gh issue create --title "PP3-1.2: Write comprehensive README.md" \
  --body "Task: Draft a professional README.md with overview, prerequisites, getting started, and links sections." \
  --milestone "Milestone 1: Week 1 - Project Scaffolding & Initial Backend"

gh issue create --title "PP3-1.3: Set up Express backend and .env config" \
  --body "Task: Build an Express backend API loader using dotenv to load variables from a .env file." \
  --milestone "Milestone 1: Week 1 - Project Scaffolding & Initial Backend"

gh issue create --title "PP3-1.4: Define project milestones and issues within GitHub" \
  --body "Task: Setup milestones and create backlogs for all 4 weeks in GitHub." \
  --milestone "Milestone 1: Week 1 - Project Scaffolding & Initial Backend"

echo "Adding Issues for Milestone 2..."
gh issue create --title "PP3-2.1: Spotify Developer Application Credentials Setup" \
  --body "Task: Register the application on the Spotify Developer Dashboard to acquire the client credentials." \
  --milestone "Milestone 2: Week 2 - Spotify Authentication & API Routing"

gh issue create --title "PP3-2.2: Implement OAuth2 Authentication Endpoints" \
  --body "Task: Build /api/login and /api/callback routes for Spotify login flow." \
  --milestone "Milestone 2: Week 2 - Spotify Authentication & API Routing"

gh issue create --title "PP3-2.3: Build Spotify wrapper API routes" \
  --body "Task: Create wrapper endpoints for search (/api/search) and profile info (/api/me)." \
  --milestone "Milestone 2: Week 2 - Spotify Authentication & API Routing"

gh issue create --title "PP3-2.4: Implement access token refresh flow" \
  --body "Task: Maintain valid Spotify access tokens by handling backend credentials refresh cycles." \
  --milestone "Milestone 2: Week 2 - Spotify Authentication & API Routing"

echo "Adding Issues for Milestone 3..."
gh issue create --title "PP3-3.1: Build Landing View & Spotify Auth Portal" \
  --body "Task: Develop frontpage with modern design containing the Spotify login portal trigger." \
  --milestone "Milestone 3: Week 3 - Frontend Integration & Dashboard UI"

gh issue create --title "PP3-3.2: Create Dashboard & Stats Display UI" \
  --body "Task: Design user profile dashboard showing music trends, top artists, and songs." \
  --milestone "Milestone 3: Week 3 - Frontend Integration & Dashboard UI"

gh issue create --title "PP3-3.3: Implement Spotify Search component" \
  --body "Task: Build an interactive search bar for tracks/albums that queries backend wrapper APIs." \
  --milestone "Milestone 3: Week 3 - Frontend Integration & Dashboard UI"

gh issue create --title "PP3-3.4: Integrate visual analytics dashboards" \
  --body "Task: Implement visualizations/graphs (valency, tempo, acousticness) of user music features." \
  --milestone "Milestone 3: Week 3 - Frontend Integration & Dashboard UI"

echo "Adding Issues for Milestone 4..."
gh issue create --title "PP3-4.1: Write unit and API endpoint tests" \
  --body "Task: Add tests verifying backend routing functions and config reliability." \
  --milestone "Milestone 4: Week 4 - Staging Deployment, Testing & Polish"

gh issue create --title "PP3-4.2: Configure production deployment pipeline" \
  --body "Task: Connect build source to Render or Railway for public live demo access." \
  --milestone "Milestone 4: Week 4 - Staging Deployment, Testing & Polish"

gh issue create --title "PP3-4.3: Conduct accessibility and performance audits" \
  --body "Task: Check contrast, ARIA tags, and Largest Contentful Paint benchmarks." \
  --milestone "Milestone 4: Week 4 - Staging Deployment, Testing & Polish"

gh issue create --title "PP3-4.4: Code cleanup and submission prep" \
  --body "Task: Refactor variables, scrub unnecessary comments, and finalize documentation." \
  --milestone "Milestone 4: Week 4 - Staging Deployment, Testing & Polish"

echo "=== GitHub Setup Complete! ==="
