# Security Tests

This folder contains the local security checks for WordMaster. These commands are designed so GitHub Actions can call them later, but the workflow files are not part of this scope.

## Current coverage

The current security coverage has two parts:

- ZAP baseline scan against the target application
- multiplayer and shop abuse checks against the target API

Scripts:

- `Testing/security/run-zap-baseline.js`
- `Testing/security/multiplayer-abuse.js`

## ZAP baseline scan

The ZAP baseline scan is a passive security scan. It is intended to catch common web security issues such as:

- missing or weak security headers
- cookie and cache configuration problems
- information disclosure findings
- other low-risk baseline web issues

This is a safe first step for CI/CD because it does not run an aggressive active attack against the application.

Run from the repository root:

```powershell
$env:BASE_URL='http://127.0.0.1:5024'
npm --prefix Testing run test:security:zap
```

The runner uses Docker and writes these reports to `Testing/security/results`:

- `zap-baseline-report.html`
- `zap-baseline-report.json`
- `zap-baseline-report.md`

By default, WARN-level ZAP findings are reported without failing the command. Set `ZAP_STRICT=true` when the command should fail on ZAP warnings or failures:

```powershell
$env:BASE_URL='https://wordmaster-05vy.onrender.com'
$env:ZAP_STRICT='true'
npm --prefix Testing run test:security:zap
```

## Multiplayer abuse checks

The multiplayer abuse script targets game-specific risks that a baseline web scan will not catch well.

Current checks:

- forged ready request against another player
- forged score update against another player
- forced leave request against another player
- host action spoofing using a known host playerId
- forged shop score sync against another player
- forged shop purchase against another player
- forged shop power-up consume against another player
- negative shop score rejection

Script:

- `Testing/security/multiplayer-abuse.js`

Run from the repository root:

```powershell
$env:BASE_URL='http://127.0.0.1:5024'
npm --prefix Testing run test:security:abuse
```

The abuse script writes these reports to `Testing/security/results`:

- `multiplayer-abuse-report.json`
- `multiplayer-abuse-report.md`

By default, abuse findings are reported without failing the command. Set `FAIL_ON_FINDINGS=true` when findings should produce a non-zero exit code:

```powershell
$env:BASE_URL='https://wordmaster-05vy.onrender.com'
$env:FAIL_ON_FINDINGS='true'
npm --prefix Testing run test:security:abuse
```

## Triggers

- local manual runs
- future GitHub Actions jobs that call the same npm scripts

## Notes

- Set `BASE_URL` to choose localhost, Render, or another target.
- Findings are written under `Testing/security/results`.
- ZAP requires Docker.
- Multiplayer checks currently report findings without failing by default.

## Maintainer

This part of the test setup was made by Oskar Gyllenor.

Questions:

- oskar.gyllenor@gmail.com
