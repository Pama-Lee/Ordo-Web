---
title: "AI writes the rules, Ordo checks them"
description: "AI makes code faster to write, and business rules faster to scatter. Why we are building Ordo as the business rule layer, and what ordo impact is for."
date: 2026-10-08
author: "Pama Lee"
tags: ["Product", "AI", "Rule Engine"]
lang: "en"
---

## The rules have always lived in code

Every team that builds business systems has code like this: what discount a member gets, how large a credit limit is, which risk score gets a payment blocked. It starts as a few ifs and ends up in dozens of files. Each time the policy changes, an engineer edits it and ships a release. Nobody can say at a glance which rules are running in production right now.

There is a new factor now: more and more of that code is written by AI. It writes fast, and it writes a lot. A request like "30 off orders over 300, but not on top of member pricing" lands in the checkout code in seconds, tests included. The trouble starts with the next change, when the same rule may get written again somewhere else.

## Take the rules out

The idea behind Ordo is simple: take these decisions out of application code and keep them in their own rule files.

- Rules are JSON or YAML, in git next to your code, where they can be reviewed and diffed.
- The expression language is bounded: no loops, no side effects. Rules written by people and rules written by AI can both be checked.
- Money is exact decimal. Inputs are declared with types, and bad input is rejected.
- Every ruleset carries its own tests, and `ordo test` runs them locally and in CI.

The calling code only asks "what discount does this order get?" However the rules change, that code stays the same.

## Passing tests are not enough

Once the rules are out, the next question is: when a number changes, who does it affect?

Here is an example. A payment risk ruleset blocks anything scoring 70 or more. The risk team wants to block from 65. After the edit, all 9 tests still pass. Looks fine.

`ordo impact` runs the edit next to the last commit, over the existing test cases, real inputs you provide, and probe inputs generated on both sides of every threshold. This time it ran 130 inputs and listed 5 whose result changed, all from "add a challenge" to "block". One of them is a long-standing customer paying 5000 from abroad on a new phone.

The tests did not cover that case. Impact found it. If it is what you wanted, add it as a test. If not, you catch it before the merge.

The check works the same for people and for AI. Coding agents can call the same command through `ordo mcp`, look at the effect of their own rule edit, and only then hand it to a person for review. That is what we mean by: AI writes the rules, Ordo checks them.

## Start from a rule pack

To make the first step shorter, we wrote three rule packs: credit approval, promo stacking and fraud scoring. Each is a complete Ordo project with rules, tests and a README that walks through impact. Copy one and change the numbers to your own policy.

A rule pack is a plain Ordo project. We hope more teams will share the rules they write the same way. The engine's job is to get the rules right. The tools, packs and integrations around it are something we can build together.

## Try it

```bash
npm i -g @ordo-engine/cli
git clone https://github.com/Ordo-Engine/Ordo
cd Ordo/examples/rule-packs/fraud-scoring
ordo test
```

Then change `$score >= 70` to `$score >= 65` in `rulesets/fraud-scoring.json` and run `ordo impact fraud-scoring`. `ordo impact` needs CLI [0.7.0](https://github.com/Ordo-Engine/Ordo/releases/tag/cli-v0.7.0) or later.

Questions or ideas? Find us on [GitHub](https://github.com/Ordo-Engine/Ordo) or [Discord](https://discord.gg/Y529FkArhh).
