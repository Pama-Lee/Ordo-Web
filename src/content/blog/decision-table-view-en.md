---
title: "Decision Table View: Making Rules Readable for Everyone"
description: "Ordo Studio's decision table view transforms complex routing matrices and approval policies into a spreadsheet-like interface — so business teams can review and edit rules without touching JSON or code."
date: 2026-04-19
author: "Pama Lee"
tags: ["Studio", "Decision Table", "Feature"]
lang: "en"
---

## The Problem with JSON-Only Rules

In most rule engine setups, rules live as JSON or YAML — authored by developers, opaque to everyone else. Business teams file tickets, engineers translate requirements into logic, and by the time a rule ships it's already been through three rounds of interpretation overhead.

Ordo's decision table view takes a different approach: **expose the structure of rules, not the code of rules**.

---

## What It Looks Like

Open any ruleset in Studio and you'll see two view buttons at the top: **Flow** and **Table**. Switch to Table and you get:

- **Columns**: input fields and output fields
- **Rows**: individual rule branches
- **Cells**: condition expressions (`>= 1000`, `in ["VIP", "SVIP"]`, etc.)

It looks and feels like a spreadsheet. Click any cell to edit the condition directly — no knowledge of the underlying AST required.

---

## How It Works Under the Hood

The decision table view is not a separate storage format. It's a projected view of the rule AST.

When Ordo parses rules, it maintains a **columnar canonical form** alongside the tree. The table view renders directly from that form. When you edit a cell, Studio writes the change back into the AST and immediately validates it using the in-browser WASM build of the engine.

This means:
- Flow view and table view are always in sync — no conversion step
- Changes trigger instant local execution, so you see output changes in real time
- Invalid expressions are flagged at the cell level, before you even hit save

---

## Use Cases

**Risk policy review**: Credit approval rules often span dozens or hundreds of branches. The table view lets risk teams audit the full matrix against business intent, without needing an engineer to translate it first.

**Promotion rule governance**: E-commerce discount and stacking rules change every campaign cycle. Operations teams can make adjustments directly in Studio, skipping the dev queue entirely.

**Compliance documentation**: In regulated industries, decision logic needs an audit trail. Tables can be exported as CSV and filed alongside compliance documentation.

---

## Flow vs. Table: Which to Use?

They're complementary, not competing:

- **Flow view** is better for understanding execution order and branching logic
- **Table view** is better for bulk-reviewing conditions and output values

A deeply nested flow is clearest in the flow diagram. But when you need to confirm "which branch does a tier-3 VIP user take?", the table lets you scan directly to the matching row and column.

---

## Try It

Open any ruleset in Studio and click the view toggle in the top-right corner. If your ruleset hasn't been through columnar normalization yet, Studio will offer an automatic migration — it preserves rule semantics and only adjusts the internal layout.

Questions or feature requests? File them at [GitHub Issues](https://github.com/Ordo-Engine/Ordo/issues).
