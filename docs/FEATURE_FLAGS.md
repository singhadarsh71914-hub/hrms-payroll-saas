# HRMS Feature Flags

The application utilizes environment-based feature flags to safely isolate advanced/experimental modules from breaking core functionality.

## Available Flags

```env
ENABLE_FACE_AI=false
ENABLE_GPS=false
ENABLE_COMMAND_CENTER=false
ENABLE_FORECASTS=false
ENABLE_WORKFORCE_MAP=false
```

## Implementation Rules
When implementing routes or services dependent on these flags, ensure safe fallbacks:

```ts
if (!process.env.ENABLE_GPS) {
  return res.json({
    enabled: false,
    message: "GPS feature is currently disabled."
  });
}
```

Advanced features behind these flags must NEVER bleed into or break core workflows (e.g. standard login, attendance, and payroll processes).
