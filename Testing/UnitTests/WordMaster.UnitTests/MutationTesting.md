# Mutation Testing

Mutation testing checks whether the existing unit tests catch small changes in the production code. This project uses Stryker.NET against the backend xUnit tests.

There is no separate mutation test folder. Stryker mutates selected backend files and reruns the tests in this unit test project.

## Run

From the repository root:

```powershell
npm --prefix Testing run test:mutation
```

Optional: run the normal unit tests first.

```powershell
dotnet test Testing/UnitTests/WordMaster.UnitTests/WordMaster.UnitTests.csproj
```

## Output

Stryker writes reports to:

```text
Testing/UnitTests/WordMaster.UnitTests/StrykerOutput/
```

Open the latest:

```text
StrykerOutput/<timestamp>/reports/mutation-report.html
```

`StrykerOutput` is ignored by Git.

## Current Scope

The basic config is in `stryker-config.json`.

It currently mutates:

- `backend/Services/WordValidator.cs`
- `backend/Services/ScoreCalculator.cs`
- `backend/Services/CharacterServise.cs`

The mutation level is `Basic`, and the break threshold is `0`, so mutation testing reports quality but does not fail the run based on score yet.

## Expanding Later

Good next steps:

- Add tests for surviving mutants shown in the HTML report.
- Add `GameEngine.cs` once its branch coverage is stronger.
- Add a separate manual or scheduled CI workflow.
- Raise the break threshold only after the score is stable.
