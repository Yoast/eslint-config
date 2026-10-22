import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import rule from "../rules/require-sr-only-translator-comment.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
		parserOptions: {
			ecmaFeatures: { jsx: true },
		},
	},
} );

const COMMENT = "/* translators: Hidden accessibility text. */";

ruleTester.run( "require-sr-only-translator-comment", rule, {
	valid: [
		// Comment position: inside the braces, directly before the i18n call.
		{
			code: `const x = <span className="yst-sr-only">{ ${ COMMENT } __( "foo", "d" ) }</span>;`,
		},
		// Comment position: inside sprintf(), directly before the i18n call.
		{
			code: `const x = <span className="yst-sr-only">{ sprintf( ${ COMMENT } __( "foo %s", "d" ), bar ) }</span>;`,
		},
		// aria-label — comment position: before the attribute.
		{
			code: `const x = <button ${ COMMENT } aria-label={ __( "close", "d" ) } />;`,
		},
		// aria-label — comment position: before the JSXExpressionContainer.
		{
			code: `const x = <button aria-label=${ COMMENT }{ __( "close", "d" ) }></button>;`,
		},
		// aria-label — comment position: inside the braces, before the call.
		{
			code: `const x = <button aria-label={ ${ COMMENT } __( "close", "d" ) }></button>;`,
		},
		// Nested sr-only inside non-sr-only — inner call has its own comment, nothing fires.
		{
			code: `const x = <div><span className="yst-sr-only">{ ${ COMMENT } __( "foo", "d" ) }</span></div>;`,
		},
		// Non-sr-only context — no comment required.
		{
			code: "const x = <span className=\"visible\">{ __( \"foo\", \"d\" ) }</span>;",
		},
		// Non-i18n expression in sr-only — nothing to check.
		{
			code: "const x = <span className=\"yst-sr-only\">{ someVariable }</span>;",
		},
		// sr-only (Tailwind default) is recognised.
		{
			code: `const x = <span className="sr-only">{ ${ COMMENT } __( "foo", "d" ) }</span>;`,
		},
		// screen-reader-text (WordPress core) is recognised.
		{
			code: `const x = <span className="screen-reader-text">{ ${ COMMENT } __( "foo", "d" ) }</span>;`,
		},
	],
	invalid: [
		// Missing comment inside yst-sr-only.
		{
			code: "const x = <span className=\"yst-sr-only\">{ __( \"foo\", \"d\" ) }</span>;",
			errors: [ { messageId: "missing" } ],
		},
		// Missing comment inside sr-only.
		{
			code: "const x = <span className=\"sr-only\">{ __( \"foo\", \"d\" ) }</span>;",
			errors: [ { messageId: "missing" } ],
		},
		// Missing comment inside screen-reader-text.
		{
			code: "const x = <span className=\"screen-reader-text\">{ __( \"foo\", \"d\" ) }</span>;",
			errors: [ { messageId: "missing" } ],
		},
		// Missing comment on aria-label.
		{
			code: "const x = <button aria-label={ __( \"close\", \"d\" ) } />;",
			errors: [ { messageId: "missing" } ],
		},
		// Missing comment on sprintf-wrapped i18n call in sr-only.
		{
			code: "const x = <span className=\"yst-sr-only\">{ sprintf( __( \"foo %s\", \"d\" ), bar ) }</span>;",
			errors: [ { messageId: "missing" } ],
		},
		// Nested sr-only child inside a non-sr-only parent — only the child fires, once.
		{
			code: "const x = <div><span className=\"yst-sr-only\">{ __( \"foo\", \"d\" ) }</span></div>;",
			errors: [ { messageId: "missing" } ],
		},
	],
} );
