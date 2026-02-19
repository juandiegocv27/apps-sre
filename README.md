# apps-sre — ShopStack Application Code & CI Pipeline

> Application source code and GitHub Actions CI pipeline for the ShopStack SRE portfolio project. Every push triggers a fully automated build → ECR push → GitOps PR flow using keyless AWS authentication via OIDC.

Part of the [ShopStack](https://github.com/juandiegocv27/shopstack) portfolio project.

---

## What This Repo Does

This repository owns two things:

1. **Application source code** — the catalog service (and future services)
2. **CI pipeline** — GitHub Actions workflow that builds, tags, pushes images to AWS ECR, and opens an automated PR to `cluster-gitops` to deploy the new image

---

## CI Pipeline

### Trigger
Every push to `main` triggers the full pipeline.

### Flow

```
git push → main
      │
      ▼
GitHub Actions (ci.yml)
  ├── Authenticate to AWS (OIDC — no stored credentials)
  ├── Login to Amazon ECR
  ├── Build Docker image
  ├── Tag image with commit SHA
  ├── Push to ECR (770132776547.dkr.ecr.us-east-1.amazonaws.com/shopstack-catalog)
  ├── Read config from AWS Secrets Manager
  └── Open PR to cluster-gitops bumping image tag in overlays/dev/kustomization.yaml
```

### Authentication — OIDC (No Long-Lived Credentials)

GitHub Actions authenticates to AWS using OpenID Connect federation. No AWS access keys are stored in GitHub Secrets. The IAM role `shopstack-gha-codebuild-trigger` is assumed via a short-lived OIDC token scoped to this repository.

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::770132776547:role/shopstack-gha-codebuild-trigger
    aws-region: us-east-1
```

### Image Tagging Strategy

Images are tagged with the full Git commit SHA for traceability:

```
770132776547.dkr.ecr.us-east-1.amazonaws.com/shopstack-catalog:<commit-sha>
```

The `cluster-gitops` overlay is updated with the exact SHA on every successful build.

---

## Repository Structure

```
apps/
└── catalog/
    ├── Dockerfile
    ├── main.go          # (or equivalent entrypoint)
    └── ...
.github/
└── workflows/
    └── ci.yml           # Full CI pipeline
```

---

## Services

| Service | Language | Port | Health endpoint |
|---|---|---|---|
| catalog | Go | 8080 | `/health` |

---

## AWS Resources Used

| Resource | Name | Purpose |
|---|---|---|
| ECR Repository | `shopstack-catalog` | Image storage |
| IAM Role | `shopstack-gha-codebuild-trigger` | OIDC-based CI authentication |
| Secrets Manager | `shopstack/*` | Runtime configuration |
| CodeBuild Project | `shopstack-catalog-dev` | Native CI executor (pending quota) |

> **Note:** AWS CodeBuild is the target CI executor. GitHub Actions is the current workaround while an AWS support ticket resolves the concurrent build quota on a new account. The OIDC role and CodeBuild project are fully wired and ready.

---

## Related Repositories

| Repo | Role |
|---|---|
| [`shopstack`](https://github.com/juandiegocv27/infra-terraform) | Provisions all AWS resources used by this pipeline |
| [`cluster-gitops`](https://github.com/juandiegocv27/cluster-gitops) | Receives image bump PRs from this pipeline |

---

## Local Development

```bash
# Build the catalog image locally
docker build -t shopstack-catalog:local apps/catalog/

# Run it
docker run -p 8080:8080 shopstack-catalog:local

# Health check
curl http://localhost:8080/health
```
