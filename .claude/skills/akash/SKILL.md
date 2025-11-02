---
name: akash
description: Guide for deploying containerized applications on Akash Network, a decentralized cloud computing marketplace. Use this skill when users need help creating SDL (Stack Definition Language) deployment files, troubleshooting Akash deployments, configuring compute resources (CPU, GPU, memory, storage), understanding Akash pricing and provider selection, or deploying Docker containers to the Akash Network.
version: 1.0.0
author: Permamind
license: MIT
---

# Akash Network Deployment Assistant

## Overview

Akash Network is a decentralized cloud computing marketplace where users deploy containerized workloads through a reverse auction system. This skill provides guidance for creating SDL (Stack Definition Language) files, deploying applications, and troubleshooting deployments on Akash.

## Core Concepts

### Stack Definition Language (SDL)

SDL is a YAML-based declarative language for specifying deployment requirements. It is compatible with the YAML standard and similar to Docker Compose files. An SDL file defines:

- **Services**: Docker containers to deploy
- **Resources**: CPU, memory, storage, and GPU requirements
- **Pricing**: Maximum bid amounts in uAKT (micro-AKT tokens)
- **Placement**: Provider requirements and attributes

### Deployment Workflow

1. User creates SDL file (`deploy.yaml`)
2. Deployment request is broadcast to the network
3. Providers bid on the deployment in a reverse auction
4. User selects a provider based on price and attributes
5. Container is deployed on the provider's Kubernetes infrastructure

## Using the Akash Documentation MCP Server

This skill integrates with the Akash Docs MCP server to provide up-to-date documentation. Use these MCP tools:

### Searching Documentation

When users ask about Akash concepts, features, or troubleshooting:

```
mcp__akash_Docs__search_docs_documentation
```

Use specific queries like:
- "deployment troubleshooting"
- "GPU provider requirements"
- "SDL syntax examples"
- "pricing and bidding"
- "persistent storage"

### Searching Code Examples

To find specific SDL examples or configuration patterns:

```
mcp__akash_Docs__search_docs_code
```

Use queries like:
- "GPU deployment"
- "persistent storage"
- "environment variables"
- "multiple services"

### Fetching Referenced URLs

If the documentation references external URLs, fetch them with:

```
mcp__akash_Docs__fetch_generic_url_content
```

## Deployment Assistance Workflow

### Step 1: Understand Requirements

When a user requests deployment help, gather:

1. **Application type**: Web app, API, database, ML model, etc.
2. **Container image**: Docker image name and tag
3. **Resource needs**: CPU, memory, storage requirements
4. **Networking**: Ports to expose, domain names
5. **Special requirements**: GPU, persistent storage, environment variables

### Step 2: Select Template

Choose the appropriate SDL template from `assets/`:

- **`web-app-template.yaml`**: Static websites, simple web servers
- **`api-service-template.yaml`**: REST APIs, backend services
- **`database-template.yaml`**: Multi-service deployments with databases
- **`gpu-template.yaml`**: ML/AI workloads requiring GPU

To use a template, read it first:

```
Read: /path/to/skill/assets/web-app-template.yaml
```

### Step 3: Customize SDL

Modify the template based on requirements:

#### Services Section

```yaml
services:
  web:
    image: your-image:tag
    expose:
      - port: 80        # Container port
        as: 80          # External port
        to:
          - global: true  # Expose to internet
        accept:
          - your-domain.com  # Custom domain
    env:
      - "KEY=value"
```

#### Compute Resources

```yaml
profiles:
  compute:
    web:
      resources:
        cpu:
          units: 0.5      # CPU cores (0.5, 1.0, 2.0, etc.)
        memory:
          size: 512Mi     # RAM (512Mi, 1Gi, 2Gi, etc.)
        storage:
          size: 1Gi       # Disk space
```

#### GPU Configuration

For GPU workloads:

```yaml
gpu:
  units: 1
  attributes:
    vendor:
      nvidia:
        - model: rtx3090
        - model: rtx4090
        - model: a100
```

#### Pricing

Set maximum bid price in uAKT (1 AKT = 1,000,000 uAKT):

```yaml
profiles:
  placement:
    dcloud:
      pricing:
        web:
          denom: uakt
          amount: 1000    # Max bid per block
```

**Pricing guidelines:**
- Simple web apps: 1000-2000 uAKT
- API services: 2000-5000 uAKT
- Databases: 5000-10000 uAKT
- GPU workloads: 50000-200000 uAKT

### Step 4: Validate and Deploy

After creating the SDL file:

1. Validate YAML syntax
2. Check resource specifications are realistic
3. Verify image names and tags are correct
4. Ensure pricing is competitive

Provide deployment instructions:

```bash
# Deploy using Akash CLI
akash tx deployment create deploy.yaml --from <wallet> --node <node-url> --chain-id <chain-id>

# Query bids
akash query market bid list --owner <address>

# Create lease
akash tx market lease create --dseq <deployment-seq> --from <wallet>
```

## Common Deployment Patterns

### Multi-Service Applications

For applications with multiple containers (e.g., frontend + backend + database):

```yaml
services:
  frontend:
    image: frontend:latest
    expose:
      - port: 80
        to:
          - global: true

  backend:
    image: backend:latest
    expose:
      - port: 3000
        to:
          - service: frontend
    depends_on:
      - db

  db:
    image: postgres:15
    expose:
      - port: 5432
        to:
          - service: backend
```

### Persistent Storage

For applications requiring persistent data:

```yaml
services:
  app:
    image: myapp:latest
    params:
      storage:
        data:
          mount: /data
          readOnly: false

profiles:
  compute:
    app:
      resources:
        storage:
          - size: 10Gi
            attributes:
              persistent: true
              class: beta3
```

### Environment Variables and Secrets

```yaml
services:
  app:
    image: myapp:latest
    env:
      - "DATABASE_URL=postgresql://user:pass@db:5432/mydb"
      - "API_KEY=your-secret-key"
      - "NODE_ENV=production"
```

**Security note**: SDL files are public on-chain. For sensitive values, use provider-side secret management or encrypted environment variables.

## Troubleshooting

### Common Issues

**Deployment not receiving bids:**
- Check pricing is competitive (increase `amount` in pricing section)
- Verify resource requirements are available (especially GPU models)
- Ensure provider attributes match available providers

**Container fails to start:**
- Verify Docker image exists and is publicly accessible
- Check environment variables are correctly formatted
- Review resource limits (may be too low)

**Network connectivity issues:**
- Verify port mappings in `expose` section
- Check domain configuration in `accept` list
- Ensure firewall rules allow traffic

**Out of memory/resources:**
- Increase memory/CPU in compute profile
- Check application resource usage
- Consider splitting into multiple services

### Getting Help

Use the MCP search tools to find relevant documentation:

```
mcp__akash_Docs__search_docs_documentation with query: "troubleshooting deployment failed"
```

## Best Practices

1. **Start with templates**: Use provided templates as starting points
2. **Test locally**: Verify Docker images work before deploying
3. **Conservative resources**: Start with lower resources, scale up as needed
4. **Monitor pricing**: Check current market rates before setting bids
5. **Use specific tags**: Avoid `:latest` tags, use specific versions
6. **Document dependencies**: Note service dependencies in SDL comments
7. **Health checks**: Ensure containers have proper health check endpoints

## Resources

### SDL Templates (assets/)

Ready-to-use templates for common deployment scenarios:

- **`web-app-template.yaml`**: NGINX web server example
- **`api-service-template.yaml`**: Node.js API service
- **`database-template.yaml`**: PostgreSQL + API multi-service
- **`gpu-template.yaml`**: PyTorch ML/AI workload with GPU

Read templates directly from the skill's assets directory and customize for user requirements.
