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
- `aria-label` JSX attributes.

**Strings with placeholders.** Combine both notes into one `translators:` comment — the rule accepts the hidden-accessibility marker anywhere inside it:

```jsx
<span className="yst-sr-only">
	{
		/* translators: Hidden accessibility text; %s: user name. */
		sprintf( __( "Logged in as %s", "my-text-domain" ), name )
	}
</span>
```

**Limitations.** The `className` check only inspects string literals — dynamic class names built with template literals, `classNames()`/`clsx()` calls, or variables are not analysed and will be skipped.