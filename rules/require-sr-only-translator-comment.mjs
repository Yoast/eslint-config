const I18N_CALLS = new Set( [ "__", "_x", "_n", "_nx" ] );
const TRANSLATOR_COMMENT_RE = /translators:\s*Hidden accessibility text/i;

const isI18nCall = ( node ) => (
	node.type === "CallExpression" &&
	node.callee.type === "Identifier" &&
	I18N_CALLS.has( node.callee.name )
);

const findI18nCall = ( node ) => {
	if ( ! node || node.type !== "CallExpression" ) {
		return null;
	}
	if ( isI18nCall( node ) ) {
		return node;
	}
	for ( const arg of node.arguments ) {
		const found = findI18nCall( arg );
		if ( found ) {
			return found;
		}
	}
	return null;
};

const isTranslatorComment = ( comment ) =>
	comment.type === "Block" && TRANSLATOR_COMMENT_RE.test( comment.value );

const hasTranslatorComment = ( sourceCode, ...nodes ) =>
	nodes.some( node => sourceCode.getCommentsBefore( node ).some( isTranslatorComment ) );

const hasTranslatorCommentInRange = ( sourceCode, startIndex, endIndex ) =>
	sourceCode.getAllComments().some(
		c => c.type === "Block" && c.range[ 0 ] >= startIndex && c.range[ 1 ] <= endIndex && TRANSLATOR_COMMENT_RE.test( c.value ),
	);

const hasSrOnlyClass = ( openingElement ) => {
	const classAttr = openingElement.attributes.find(
		attr => attr.type === "JSXAttribute" && attr.name.name === "className",
	);
	return (
		classAttr &&
		classAttr.value &&
		classAttr.value.type === "Literal" &&
		classAttr.value.value.includes( "yst-sr-only" )
	);
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: "problem",
		docs: {
			description: "Require /* translators: Hidden accessibility text. */ before i18n calls in screen-reader-only contexts (yst-sr-only elements and aria-label attributes).",
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
				for ( const child of node.children ) {
					if ( child.type !== "JSXExpressionContainer" ) {
						continue;
					}
					const i18nCall = findI18nCall( child.expression );
					if ( ! i18nCall ) {
						continue;
					}
					if (
						! hasTranslatorComment( sourceCode, child, child.expression, i18nCall ) &&
						! hasTranslatorCommentInRange( sourceCode, child.range[ 0 ], i18nCall.range[ 0 ] )
					) {
						context.report( { node: i18nCall, messageId: "missing" } );
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
				const i18nCall = findI18nCall( node.value.expression );
				if ( ! i18nCall ) {
					return;
				}
				const attrs = node.parent.attributes;
				const attrIndex = attrs.indexOf( node );
				const rangeStart = attrIndex > 0 ? attrs[ attrIndex - 1 ].range[ 1 ] : node.parent.range[ 0 ];
				if (
					! hasTranslatorComment( sourceCode, node, node.value, i18nCall ) &&
					! hasTranslatorCommentInRange( sourceCode, rangeStart, node.range[ 1 ] )
				) {
					context.report( { node: i18nCall, messageId: "missing" } );
				}
			},
		};
	},
};
