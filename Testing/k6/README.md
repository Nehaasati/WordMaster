# k6 Performance Tests

This folder contains performance tests for the deployed WordMaster backend.

## Scope

The current script, `wordmaster-multiplayer.js`, exercises a multiplayer and shop flow over HTTP:

1. Create lobby
2. Join lobby
3. Mark host ready
4. Mark guest ready
5. Start game
6. Load shop state
7. Sync shop score
8. Purchase a letter
9. Purchase and consume a power-up
10. Leave lobby

The goal is to measure latency, failure rate, and basic flow stability under load. These tests complement the existing functional tests; they do not replace unit, API, or UI regression coverage.

## Profiles

- `smoke`: short, low-concurrency PR validation
- `load`: lower concurrency, suitable for regular validation
- `stress`: higher concurrency, intended for manual runs

## Prerequisites

`k6` is only required for local execution. GitHub Actions installs it during the performance workflow.

Windows install options:

- `winget install k6 --source winget`
- `choco install k6`

Verify the installation:

```powershell
k6 version
```

References:

- https://grafana.com/docs/k6/latest/set-up/install-k6/
- https://github.com/grafana/setup-k6-action

## Local execution

Run from the repository root.

Smoke profile against a local backend:

```powershell
$env:BASE_URL='http://127.0.0.1:5024'
npm --prefix Testing run test:perf:smoke
```

Load profile against Render:

```powershell
$env:BASE_URL='https://wordmaster-05vy.onrender.com'
npm --prefix Testing run test:perf:load
```

Stress profile:

```powershell
$env:BASE_URL='https://wordmaster-05vy.onrender.com'
npm --prefix Testing run test:perf:stress
```

If `k6` was just installed and PowerShell cannot find it, restart the terminal and run `k6 version` again.

JSON summaries are written to `Testing/k6/results`.

## Optional PowerShell shortcut

If you do not want to type the full command every time, you can add a small helper function in PowerShell.

Create a session-only shortcut:

```Time Saver
function runk6load { $env:BASE_URL='https://wordmaster-05vy.onrender.com'; npm --prefix Testing run test:perf:load }
function runk6stress { $env:BASE_URL='https://wordmaster-05vy.onrender.com'; npm --prefix Testing run test:perf:stress }
```

Then run:

```Rider
runk6load
runk6stress
```

For a permanent shortcut:

1. Open your PowerShell profile:

```powershell
notepad $PROFILE
```

2. Paste the function into that file and save it.
3. Restart PowerShell.
4. Run:

```powershell
runk6load
```

You can create a similar function for the stress profile by changing `TEST_PROFILE` from `load` to `stress`.

## GitHub Actions

Performance tests run in a separate workflow: `.github/workflows/performance.yml`.

Supported triggers:

- pull request smoke run against the PR backend
- manual run with profile selection
- nightly scheduled run

Repository configuration:

- Variable name: `RENDER_BASE_URL`
- Example value: `https://wordmaster-05vy.onrender.com`

The manual workflow can also override the target URL for a specific run.

## Maintainer

This part of the test setup was made by, yours truly, Oskar Gyllenör.

If you have any questions, feel free to contact:

- oskar.gyllenor@gmail.com
