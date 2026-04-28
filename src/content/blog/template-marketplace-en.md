---
title: "Template Marketplace: From Example to Production in One Click"
description: "Ordo's template marketplace ships with real-world rule examples for common business scenarios and supports loading community templates from GitHub. Browse, preview, and create a project in one click."
date: 2026-04-19
author: "Pama Lee"
tags: ["Studio", "Templates", "Feature"]
lang: "en"
---

## The Cost of Starting from Blank

Every time a team builds a new ruleset, they repeat the same work: define the input schema, figure out the branching logic, write the first test case. This groundwork looks nearly identical across scenarios — yet it gets redone from scratch every time.

The template marketplace exists to solve that: **pre-package the common rule structures so you don't start from an empty file**.

---

## What's Included?

The built-in templates currently cover:

**Financial Risk**
- Credit approval: three-factor decisioning based on credit score, debt ratio, and income level
- Fraud detection: risk scoring from device fingerprint, IP origin, and behavioral sequences

**E-Commerce Operations**
- Promotion rules: threshold discounts, percentage off, and stacking eligibility
- Inventory routing: fulfillment strategy based on stock levels, warehouse location, and delivery SLA

**API Gateway**
- Traffic routing: split traffic by request headers, user labels, or canary percentage
- Rate limiting: per-tier QPS limits keyed by tenant level

Every template ships with a full test suite. You can run it before creating a project to confirm the behavior matches your expectations.

---

## GitHub Template Marketplace

Beyond built-ins, Studio supports loading templates from any public GitHub repository that follows the Ordo template spec.

The flow is simple:
1. Click **From GitHub** in the marketplace
2. Enter a repo (`owner/repo`)
3. Studio reads the `ordo-template.json` manifest at the repo root and shows available templates
4. Preview, then create with one click

**Publishing Your Own Template**

To publish a template, add to your repo:
- `ordo-template.json`: metadata (name, description, tags, preview image)
- `rules/`: the ruleset directory
- `tests/`: test case directory

Community templates can be submitted to [Ordo Community Templates](https://github.com/Ordo-Engine/Ordo) for listing in the built-in marketplace.

---

## Templates and Version Tracking

Projects created from a template record the source template and version in the initial git commit. When a template releases a new version, Studio shows an update prompt in the project — you can review the diff and merge selectively, rather than overwriting everything.

Templates aren't just copy-paste. They're a **traceable starting point**.

---

## Who Is This For?

- **Teams new to rule engines**: A template gives you a working, runnable starting point more effectively than documentation alone
- **Product managers validating logic**: Pick the closest template, tweak a few condition values, and see execution output immediately
- **Teams sharing rule designs internally**: Publish your accumulated templates to GitHub and reuse them across projects

---

## Get Started

Open Studio, click **New Project**, and choose **Create from Template**. If you have a template worth sharing, open a PR at [GitHub](https://github.com/Ordo-Engine/Ordo).
