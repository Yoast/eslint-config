/**
 * @param {import('eslint').Rule.Node} callee
 * @returns {boolean}
 */
const isCreateInterpolateElementCallee = ( callee ) => {
	if ( callee.type === "Identifier" ) {
		return callee.name === "createInterpolateElement";
	}
	if ( callee.type !== "MemberExpression" ) {
		return false;
	}
	if ( ! callee.computed ) {
		return callee.property.name === "createInterpolateElement";
	}
	return callee.property.type === "Literal" && callee.property.value === "createInterpolateElement";
};

/**
 * @param {import('eslint').Rule.Node} node
 * @returns {boolean}
 */
const isInsideProtectedTry = ( node ) => {
	let child = node;
	let ancestor = node.parent;
	while ( ancestor ) {
		if ( ancestor.type === "TryStatement" && ancestor.handler && ancestor.block === child ) {
			return true;
		}
		child = ancestor;
		ancestor = ancestor.parent;
	}
	return false;
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: "suggestion",
		docs: {
			description: "Disallow createInterpolateElement calls that are not wrapped in a try-catch block",
			recommended: true,
		},
		schema: [],
		messages: {
			unsafeUsage: "Use safeCreateInterpolateElement instead, or wrap createInterpolateElement in a try-catch block.",
		},
	},
	create( context ) {
		return {
			CallExpression( node ) {
				if ( ! isCreateInterpolateElementCallee( node.callee ) || isInsideProtectedTry( node ) ) {
					return;
				}
				context.report( { node, messageId: "unsafeUsage" } );
			},
		};
	},
};
