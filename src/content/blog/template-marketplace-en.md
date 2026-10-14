---
title: "Template Marketplace: Start a Project from a Working Example"
description: "Ordo's template marketplace includes rule examples for common business scenarios and can load community templates from GitHub. Look at an example, then create a project from it instead of starting from an empty file."
date: 2026-04-19
author: "Pama Lee"
tags: ["Studio", "Templates", "Feature"]
lang: "en"
---

## The cost of starting from blank

Every new ruleset starts with the same work: define the input schema, work out the branching logic, write the first test case. This work looks much the same from one scenario to the next, but it gets done again each time.

The template marketplace has common rule structures written in advance, so a new project can start from a template.

---

## Built-in templates

The built-in templates currently cover:

**Financial risk**
- Credit approval: decides whether to lend based on credit score, debt ratio and income level
- Fraud detection: scores risk from device fingerprint, IP location and behavior sequences

**E-commerce operations**
- Promotion rules: threshold discounts, percentage off and stacking eligibility
- Inventory routing: picks where to ship from based on stock levels, warehouse location and delivery SLA

**API gateway**
- Traffic routing: splits traffic by request headers, user labels or canary percentage
- Rate limiting: sets QPS limits by tenant tier

Every template comes with a full test suite. You can run it before creating a project to confirm the behavior is what you expect.

---

## Templates from GitHub

Studio can also load templates from any public GitHub repository that follows the Ordo template spec.

Steps:
1. Click **From GitHub** in the marketplace
2. Enter a repo (`owner/repo`)
3. Studio reads the `ordo-template.json` manifest at the repo root and lists the templates in it
4. Preview one, then create a project from it

### Publishing your own template

To publish a template, add these to your repo:
- `ordo-template.json`: metadata (name, description, tags, preview image)
- `rules/`: the ruleset directory
- `tests/`: the test case directory

Community templates can be submitted to [Ordo Community Templates](https://github.com/Ordo-Engine/Ordo) for listing in the built-in marketplace.

---

## Templates and versions

A project created from a template records the source template and its version in the initial git commit. When the template gets a new version, Studio shows an update prompt in the project. You can review the diff and merge the parts you want instead of overwriting everything.

You can also always tell which template and version a project started from.

---

## Who it's for

- **Teams new to rule engines**: editing a template that already runs is a faster start than reading the docs alone
- **Product managers checking business logic**: pick the closest template, change a few condition values, and see the result right away
- **Teams reusing rule designs internally**: publish your templates to GitHub and use them in other projects

---

## Get started

Open Studio, click **New Project**, and choose **Create from Template**. If you have a template to share, open a PR on [GitHub](https://github.com/Ordo-Engine/Ordo).
