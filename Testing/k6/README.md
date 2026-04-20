# k6 Performance Tests

This folder contains performance tests for the deployed WordMaster backend.

## Scope

The current script, `wordmaster-multiplayer.js`, exercises a multiplayer lobby flow over HTTP:

1. Create lobby
2. Join lobby
3. Mark host ready
4. Mark guest ready
5. Start game
6. Leave lobby

The goal is to measure latency, failure rate, and basic flow stability under load. These tests complement the existing functional tests; they do not replace unit, API, or UI regression coverage.

## Profiles

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

Load profile against Render:

```powershell
$env:BASE_URL='https://wordmaster-05vy.onrender.com'
$env:TEST_PROFILE='load'
k6 run .\Testing\k6\wordmaster-multiplayer.js
```

Stress profile:

```powershell
$env:BASE_URL='https://wordmaster-05vy.onrender.com'
$env:TEST_PROFILE='stress'
k6 run .\Testing\k6\wordmaster-multiplayer.js
```

If `k6` was just installed and PowerShell cannot find it, restart the terminal and run `k6 version` again.

## Optional PowerShell shortcut

If you do not want to type the full command every time, you can add a small helper function in PowerShell.

Create a session-only shortcut:

```Time Saver
function runk6load { $env:BASE_URL='https://wordmaster-05vy.onrender.com'; $env:TEST_PROFILE='load'; & 'C:\Program Files\k6\k6.exe' run .\Testing\k6\wordmaster-multiplayer.js }
function runk6stress { $env:BASE_URL='https://wordmaster-05vy.onrender.com'; $env:TEST_PROFILE='stress'; & 'C:\Program Files\k6\k6.exe' run .\Testing\k6\wordmaster-multiplayer.js }
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
