# OpenPretext Community Strategies

Community-contributed AI curation strategies for [OpenPretext](https://github.com/shandley/openpretext), a browser-based Hi-C contact map viewer and genome assembly curation tool.

## What Are Strategies?

Strategies customize how the AI assistant analyzes your Hi-C contact map. Each strategy contains:

- **Supplement text** — additional instructions appended to the base system prompt, guiding the AI to focus on specific patterns or workflows
- **Examples** — scenario/command pairs that demonstrate expected output, helping the AI produce accurate DSL commands

The base prompt already covers the full DSL command reference and general Hi-C interpretation. Strategies add domain-specific guidance on top.

## JSON Format

Each strategy is a single JSON file with the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique identifier (lowercase, hyphenated) |
| `name` | string | yes | Display name shown in the strategy dropdown |
| `description` | string | recommended | Short description of what this strategy does (defaults to `""`) |
| `category` | string | recommended | One of: `general`, `pattern`, `workflow`, `organism` (defaults to `"general"`) |
| `supplement` | string | yes | Additional prompt text (can be empty string) |
| `examples` | array | recommended | Array of example objects (defaults to `[]`) |

Each example object has:

| Field | Type | Description |
|---|---|---|
| `scenario` | string | Description of the visual pattern or situation |
| `commands` | string | DSL commands the AI should suggest |

### Example

```json
{
  "id": "my-strategy",
  "name": "My Custom Strategy",
  "description": "Focuses on a specific curation pattern.",
  "category": "pattern",
  "supplement": "Look for X pattern and suggest Y commands...",
  "examples": [
    {
      "scenario": "When you see pattern X in the contact map",
      "commands": "invert contig_1\nmove contig_2 after contig_3"
    }
  ]
}
```

## Using a Strategy

1. Download a strategy JSON file from this repository
2. Open [OpenPretext](https://github.com/shandley/openpretext) and open the AI Assist panel
3. Click **Import** and select the downloaded JSON file
4. The strategy will appear in the Strategy dropdown
5. Select it and click **Analyze Map**

## Built-in Strategies

This repository is seeded with the 5 built-in strategies that ship with OpenPretext.
These are provided as reference templates. Since they are already built into
the app, importing them will create a copy with an `imported-` ID prefix
(e.g., `imported-general`) rather than overwriting the original.

| Strategy | Category | Description |
|---|---|---|
| [General Analysis](strategies/general.json) | general | Balanced analysis suitable for any assembly |
| [Inversion Detection](strategies/inversion-focus.json) | pattern | Focuses on identifying inversions (anti-diagonal patterns) |
| [Scaffold Assignment](strategies/scaffolding.json) | workflow | Guides chromosome-level scaffolding |
| [Fragmented Assembly](strategies/fragmented-assembly.json) | workflow | Optimized for assemblies with many small contigs |
| [Micro-chromosomes](strategies/micro-chromosomes.json) | organism | For bird/reptile genomes with micro-chromosomes |

## Contributing

1. Fork this repository
2. Create your strategy JSON file in the `strategies/` directory
3. Validate that your JSON matches the format above
4. Test it by importing into OpenPretext (click **Import** in the AI panel)
5. Submit a pull request with a brief description of what your strategy targets

### Naming Conventions

- Use lowercase, hyphenated file names: `my-strategy-name.json`
- Use a unique `id` that won't collide with existing strategies
- Choose a descriptive `name` that fits in a dropdown menu
- Pick the most appropriate `category`:
  - `general` — broadly applicable strategies
  - `pattern` — targets specific Hi-C visual patterns (inversions, translocations, etc.)
  - `workflow` — multi-step curation workflows (scaffolding, quality control, etc.)
  - `organism` — organism-specific guidance (birds, plants, etc.)

## License

Contributions are shared under [MIT License](LICENSE).
