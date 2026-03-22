# Fantasy Fight Picker

A fantasy sports app for combat sports fans. Browse upcoming fight cards, research fighters, make predictions before events lock, and earn points based on accuracy. Compete on leaderboards and in head-to-head leagues.

---

## What this repo contains

**Monorepo with three main areas:**

- `frontend/` — React 18 + Vite SPA, deployed to S3/CloudFront
- `backend/` — Node.js Lambda handlers + services, behind API Gateway
- `infra/` — Terraform modules for all AWS infrastructure

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, Framer Motion |
| Backend | Node.js 22, AWS Lambda, DynamoDB |
| Auth | Amazon Cognito (user pools + hosted UI) |
| Infra | Terraform, AWS (Lambda, API Gateway, DynamoDB, Cognito, EventBridge, CloudFront, Route53, ACM) |
| CI/CD | GitHub Actions with AWS OIDC

---

## Features

**User-facing:**
- Sign up / login via Cognito
- Browse upcoming events and fight cards
- Research fighter profiles and head-to-head comparisons
- Submit picks before events lock (EventBridge schedule locks events automatically)
- View your picks, points, and result history
- Leaderboard and head-to-head league view

**Admin:**
- Create and manage events, fighters, and fights
- Enter official results to trigger scoring

---

## Project structure

```
fantasy-fight-picker/
├── frontend/           # React SPA
│   └── src/
│       ├── pages/      # Route-level components
│       ├── components/ # Shared UI components
│       ├── context/    # Auth context
│       └── routes/     # React Router config + route protection
├── backend/
│   └── src/
│       ├── handlers/   # One file per Lambda function
│       └── services/   # Business logic (events, fighters, fights, picks, scoring)
├── infra/
│   ├── env/sandbox/    # Environment root (tfvars, backend config)
│   ├── modules/        # Reusable Terraform modules
│   └── scripts/        # Local workflow scripts
└── .github/workflows/  # CI/CD pipelines
```

---

## CI/CD

All pipelines use AWS OIDC (no long-lived credentials).

| Workflow | Trigger | What it does |
|---|---|---|
| Test | Every PR | Vitest for backend + frontend |
| Plan | PR to `main` | `fmt → validate → tflint → plan` |
| Apply | Manual (`workflow_dispatch`) | Terraform apply + S3/CloudFront deploy + cache invalidation |

---

## Git Bash only

All scripts below assume **Git Bash** on Windows.

---

## Local setup + end-to-end test (all commands)

Run everything below in **Git Bash** from the repo root:

```bash
# verify prerequisites in THIS Git Bash shell
bash infra/scripts/prereqs.sh

# switch AWS context (AWS_PROFILE is set to match the environment and must exist under infra/env/)
export ENVIRONMENT="<aws-account>"
source infra/scripts/use-env.sh "$ENVIRONMENT"

# confirm which AWS account/role you are about to use
bash infra/scripts/whoami.sh

# bootstrap remote state + execution role in the CURRENT AWS account
# creates: S3 state bucket, DynamoDB lock table, OIDC Github Role
# generates: infra/backend.hcl
bash infra/scripts/bootstrap-state.sh "$ENVIRONMENT" --region eu-west-2

# initialise Terraform for the environment using the generated backend config
cd "infra/env/$ENVIRONMENT"
terraform init -backend-config=backend.hcl

# CD BACK TO THE ROOT TO RUN THE BELOW SCRIPTS

# validate (fmt check + validate + tflint)
bash infra/scripts/validate.sh "$ENVIRONMENT"

# plan (creates a saved tfplan file)
bash infra/scripts/plan.sh "$ENVIRONMENT"
test -f "infra/env/$ENVIRONMENT/tfplan" && echo "tfplan created" || (echo "tfplan missing" && exit 1)

# apply (applies the saved tfplan file)
bash infra/scripts/apply.sh "$ENVIRONMENT"
```
