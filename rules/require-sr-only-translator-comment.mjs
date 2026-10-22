const I18N_CALLS = new Set( [ "__", "_x", "_n", "_nx" ] );
const SR_ONLY_CLASSES = new Set( [ "yst-sr-only", "sr-only", "screen-reader-text" ] );
const TRANSLATOR_COMMENT_RE = /translators:.*Hidden accessibility text/is;

const isI18nCall = ( node ) => (
	node.type === "CallExpression" &&
	node.callee.type === "Identifier" &&
	I18N_CALLS.has( node.callee.name )
);

// Collects every i18n call reachable from node in supported expression shapes:
// direct i18n call, sprintf() wrapping i18n calls, or conditional/logical expressions.
// Arbitrary call wrappers other than sprintf() are not traversed.
const collectI18nCalls = ( node, result = [] ) => {
	if ( ! node ) {
		return result;
	}
	if ( isI18nCall( node ) ) {
		result.push( node );
		return result;
	}
	if ( node.type === "CallExpression" ) {
		if ( node.callee.type === "Identifier" && node.callee.name === "sprintf" ) {
			for ( const arg of node.arguments ) {
				collectI18nCalls( arg, result );
			}
		}
		return result;
	}
	if ( node.type === "ConditionalExpression" ) {
		collectI18nCalls( node.consequent, result );
		collectI18nCalls( node.alternate, result );
		return result;
	}
	if ( node.type === "LogicalExpression" ) {
		collectI18nCalls( node.left, result );
		collectI18nCalls( node.right, result );
		return result;
	}
	return result;
};

const isTranslatorComment = ( comment ) =>
	comment.type === "Block" && TRANSLATOR_COMMENT_RE.test( comment.value );

// Checks for a translator comment immediately preceding any of the supplied nodes.
const hasTranslatorComment = ( sourceCode, ...nodes ) =>
	nodes.some( node => sourceCode.getCommentsBefore( node ).some( isTranslatorComment ) );

// Extracts the className string value from either `className="…"` or `className={"…"}`.
const getClassNameValue = ( classAttr ) => {
	if ( ! classAttr || ! classAttr.value ) {
		return null;
	}
	if ( classAttr.value.type === "Literal" ) {
		return classAttr.value.value;
	}
	if (
		classAttr.value.type === "JSXExpressionContainer" &&
		classAttr.value.expression.type === "Literal"
	) {
		return classAttr.value.expression.value;
	}
	return null;
};

const hasSrOnlyClass = ( openingElement ) => {
	const classAttr = openingElement.attributes.find(
		attr => attr.type === "JSXAttribute" && attr.name.name === "className",
	);
	const className = getClassNameValue( classAttr );
	if ( typeof className !== "string" ) {
		return false;
	}
	return className.split( /\s+/ ).some( cls => SR_ONLY_CLASSES.has( cls ) );
};

// Recursively collects JSXExpressionContainers from descendant nodes, stopping
// at nested sr-only elements (those are handled by their own JSXElement visitor call).
const collectDescendantExpressionContainers = ( children, result = [] ) => {
	for ( const child of children ) {
		if ( child.type === "JSXExpressionContainer" ) {
			result.push( child );
		} else if ( child.type === "JSXElement" && ! hasSrOnlyClass( child.openingElement ) ) {
			collectDescendantExpressionContainers( child.children, result );
		} else if ( child.type === "JSXFragment" ) {
			collectDescendantExpressionContainers( child.children, result );
		}
	}
	return result;
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: "problem",
		docs: {
			description: "Require /* translators: Hidden accessibility text. */ before i18n calls in screen-reader-only contexts (yst-sr-only, sr-only, screen-reader-text elements and aria-label attributes).",
		},
		messages: {
			missing: "Add /* translators: Hidden accessibility text. */ before this i18n call — its output is only visible to screen readers.",
		},
		schema: [],
	},
	create( context ) {
		const sourceCode = context.sourceCode || context.getSourceCode();

		return {
			JSXElement( node ) {
				if ( ! hasSrOnlyClass( node.openingElement ) ) {
					return;
				}
				for ( const container of collectDescendantExpressionContainers( node.children ) ) {
					for ( const i18nCall of collectI18nCalls( container.expression ) ) {
						if ( ! hasTranslatorComment( sourceCode, container, container.expression, i18nCall ) ) {
							context.report( { node: i18nCall, messageId: "missing" } );
						}
					}
				}
			},
			JSXAttribute( node ) {
				if ( node.name.name !== "aria-label" ) {
					return;
				}
				if ( ! node.value || node.value.type !== "JSXExpressionContainer" ) {
					return;
				}
				for ( const i18nCall of collectI18nCalls( node.value.expression ) ) {
					if ( ! hasTranslatorComment( sourceCode, node, node.value, node.value.expression, i18nCall ) ) {
						context.report( { node: i18nCall, messageId: "missing" } );
					}
				}
			},
		};
	},
};
