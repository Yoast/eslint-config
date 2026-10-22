import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import rule from "../rules/no-unsafe-create-interpolate-element.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
	},
} );

ruleTester.run( "no-unsafe-create-interpolate-element", rule, {
	valid: [
		// Direct try-catch wrapping the call.
		{
			code: "try { createInterpolateElement( str, map ); } catch ( e ) {}",
		},
		// Try-catch wrapping the call through an intermediate block.
		{
			code: "try { if ( cond ) { createInterpolateElement( str, map ); } } catch ( e ) {}",
		},
		// Member-expression call wrapped in try-catch.
		{
			code: "try { element.createInterpolateElement( str, map ); } catch ( e ) {}",
		},
		// Computed member access with the string literal, wrapped in try-catch.
		{
			code: "try { element[ \"createInterpolateElement\" ]( str, map ); } catch ( e ) {}",
		},
		// Different function name — not the one we police.
		{
			code: "safeCreateInterpolateElement( str, map );",
		},
		// Unrelated call — not the one we police.
		{
			code: "someOtherFunction( str, map );",
		},
		// Member with a different property name.
		{
			code: "element.somethingElse( str, map );",
		},
		// Computed member with a non-matching literal.
		{
			code: "element[ \"somethingElse\" ]( str, map );",
		},
	],
	invalid: [
		// Bare top-level call — the common unsafe case.
		{
			code: "createInterpolateElement( str, map );",
			errors: [ { messageId: "unsafeUsage" } ],
		},
		// Member-expression call outside any try-catch.
		{
			code: "element.createInterpolateElement( str, map );",
			errors: [ { messageId: "unsafeUsage" } ],
		},
		// Computed member access with the string literal, outside try-catch.
		{
			code: "element[ \"createInterpolateElement\" ]( str, map );",
			errors: [ { messageId: "unsafeUsage" } ],
		},
		// Call inside the catch block — catch itself is not protected.
		{
			code: "try {} catch ( e ) { createInterpolateElement( str, map ); }",
			errors: [ { messageId: "unsafeUsage" } ],
		},
		// Call inside the finally block — finally is not protected.
		{
			code: "try {} catch ( e ) {} finally { createInterpolateElement( str, map ); }",
			errors: [ { messageId: "unsafeUsage" } ],
		},
		// Call wrapped only in try-finally (no catch handler) — not protected.
		{
			code: "try { createInterpolateElement( str, map ); } finally {}",
			errors: [ { messageId: "unsafeUsage" } ],
		},
		// Call inside a function declared in a try — the function body is not actually
		// executed inside the surrounding try, so it is not protected.
		{
			code: "try { const fn = () => createInterpolateElement( str, map ); } catch ( e ) {}",
			errors: [ { messageId: "unsafeUsage" } ],
		},
		// Same pattern, FunctionDeclaration flavour.
		{
			code: "try { function fn() { createInterpolateElement( str, map ); } } catch ( e ) {}",
			errors: [ { messageId: "unsafeUsage" } ],
		},
	],
} );
