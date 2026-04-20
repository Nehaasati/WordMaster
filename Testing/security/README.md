# Security Tests

This folder documents the automated security checks for WordMaster.

## Current coverage

The current security workflow has two parts:

- ZAP baseline scan against the deployed application
- multiplayer abuse checks against the deployed API

Workflow:

- `.github/workflows/security.yml`

## ZAP baseline scan

The ZAP baseline scan is a passive security scan. It is intended to catch common web security issues such as:

- missing or weak security headers
- cookie and cache configuration problems
- information disclosure findings
- other low-risk baseline web issues

This is a safe first step for CI/CD because it does not run an aggressive active attack against the application.

## Multiplayer abuse checks

The multiplayer abuse script targets game-specific risks that a baseline web scan will not catch well.

Current checks:

- forged ready request against another player
- forged score update against another player
- forced leave request against another player
- host action spoofing using a known host playerId

Script:

- `Testing/security/multiplayer-abuse.js`

## Triggers

- manual run from GitHub Actions
- nightly scheduled run

## Notes

- The scan runs against the deployed environment, not localhost.
- Findings are attached as workflow artifacts.
- The workflow is separate from the main CI pipeline on purpose, so security scanning does not slow down regular build and test feedback.
- Multiplayer checks currently report findings without failing the workflow by default.

## Maintainer

This part of the test setup was made by Oskar Gyllenor.

Questions:

- oskar.gyllenor@gmail.com
