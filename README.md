# @Yoast/eslint-config

A shared ESLint configuration used across a variety of Yoast projects. Anyone is welcome to use this configuration, but
it is primarily intended for internal use.

## Presets

This configuration contains three presets:

| Preset            | Description                                                                                                                                                                                 | Usage                                               |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| yoast/recommended | The base config. This should almost always be used. It's based on the @eslint/js/recommended and eslint-plugin-import config and contains stylistic configuration for all Yoast JavaScript. | `import yoastConfig from @yoast/eslint-config"`     | 
| yoast/react       | An extension for the base config, adding the React plugin and React/JSX-specific rules.                                                                                                     | `import { reactConfig } from @yoast/eslint-config"` |
| yoast/node        | An extension for the base config, adding the Node plugin adding some rules that are relevant when working with Node.JS.                                                                     | `import { nodeConfig } from @yoast/eslint-config"`  |

## Example usage

```js
// eslint.config.mjs
import globals from "globals";
import yoastConfig, { reactConfig } from "@yoast/eslint-config";

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ ignores: [ "build" ] },
	...yoastConfig,
	...reactConfig,
	{
		languageOptions: {
			ecmaVersion: "latest",
			globals: {
				...globals.browser,
			},
		},
		rules: {
			// Deviate from the Yoast config to allow for not using the error that is caught.
			"no-unused-vars": [ "error", { caughtErrors: "none" } ],
		},
	}
];
```

## Custom rules

### `yoast/require-sr-only-translator-comment` (react preset)

Requires a `/* translators: Hidden accessibility text. */` comment above any `__()`, `_x()`, `_n()`, `_nx()` (optionally wrapped in `sprintf()`) call whose output is only exposed to screen readers, so translators know the string has no visual context.

Fires on i18n calls inside:
- JSX elements whose `className` contains `yst-sr-only`, `sr-only`, or `screen-reader-text`.
- `aria-label` JSX attributes (matched case-sensitively — the standard HTML attribute is always lowercase).
- JSX props whose name contains `screenReader` or `ariaLabel` (matched case-insensitively, prefix or suffix), e.g. `screenReaderText`, `closeButtonScreenReaderText`, `ariaLabel`, `buttonAriaLabel`.
- Variable declarations and plain object property values whose name contains `screenReader` or `ariaLabel`, e.g. `const closeButtonScreenReaderText = __( … )`, `const ariaLabel = __( … )`, or `{ buttonAriaLabel: __( … ) }`. Place the comment before the `const`/`let`/`var` declaration, before the property key, or immediately before the i18n call.

**Strings with placeholders.** Combine both notes into one `translators:` comment — the rule accepts the hidden-accessibility marker anywhere inside it:

```jsx
<span className="yst-sr-only">
	{
		/* translators: Hidden accessibility text; %s: user name. */
		sprintf( __( "Logged in as %s", "my-text-domain" ), name )
	}
</span>
```

**Limitations.**
- The `className` check only inspects string literals — dynamic class names built with template literals, `classNames()`/`clsx()` calls, or variables are not analysed and will be skipped.
- The `screenReader` and `aria-label` checks traverse JSX element children and template literal expressions to find nested i18n calls. Spread objects in JSX (`{ ...{ screenReaderText: __( … ) } }`) are caught via the object property check. What is not covered: i18n calls stored in variables whose values are later passed as props, and deeply dynamic expressions such as `clsx()` calls.
- Placing the translator comment between `=` and `{` (e.g. `prop=/* translators: … */{ __( … ) }`) is accepted by this rule and is picked up by `wp i18n make-pot`, but is flagged as an error by other linting rules (`Unexpected comment inline with code`). Prefer placing the comment inside the braces or before the attribute instead.