---
title: "Decision Table View: Rules Business Teams Can Read"
description: "Ordo Studio's decision table view shows routing matrices and approval policies as a table, so business teams can review and edit rules without reading JSON or code."
date: 2026-04-19
author: "Pama Lee"
tags: ["Studio", "Decision Table", "Feature"]
lang: "en"
---

## Why a table view

In most rule engine setups, rules are stored as JSON or YAML. Developers write them, and business teams file tickets. Engineers translate each request into logic, and by the time a rule ships it has been reinterpreted several times.

The decision table view shows the structure of the rules directly, so reviewers don't have to read code.

---

## What it looks like

Open a ruleset in Studio and you'll see two view buttons at the top: **Flow** and **Table**. In Table view:

- Columns are input fields and output fields
- Rows are rule branches
- Cells hold condition expressions such as `>= 1000` or `in ["VIP", "SVIP"]`

It works much like a spreadsheet. Click a cell to edit the condition. You don't need to know the underlying AST.

---

## How it works

The table is not a separate storage format. It is a view projected from the rule AST.

When Ordo parses rules, it keeps a columnar canonical form next to the tree, and the table renders from that form. When you edit a cell, Studio writes the change back into the AST and validates it with the in-browser WASM build of the engine.

As a result:
- Flow view and table view stay in sync, with no conversion step
- Each change runs locally in WASM, so you see the output change right away
- An invalid expression is flagged on its cell before you save

---

## Where it helps

**Risk policy review**: credit approval rules often have dozens or hundreds of branches. Risk teams can check the whole matrix against the business intent without waiting for an engineer to translate it.

**Promotion rules**: discount and stacking rules change with every campaign. Operations teams can adjust them in Studio without going through the dev queue.

**Compliance records**: in regulated industries, decision logic needs an audit trail. Tables can be exported as CSV and filed with compliance documents.

---

## Flow or table

Each view suits a different job:

- **Flow view** shows execution order and branching
- **Table view** is for reviewing many conditions and outputs at once

A deeply nested flow is easier to follow in the flow diagram. To check "which branch does a tier-3 VIP user take?", the table takes you straight to the row and column.

---

## Try it

Open any ruleset in Studio and click the view toggle in the top-right corner. If the ruleset hasn't been through columnar normalization yet, Studio offers an automatic migration. The migration keeps rule semantics and only changes the internal layout.

Questions or feature requests go to [GitHub Issues](https://github.com/Ordo-Engine/Ordo/issues).
