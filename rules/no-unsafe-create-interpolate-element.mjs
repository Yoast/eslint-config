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
				const { callee } = node;
				const isCreateInterpolateElement =
					( callee.type === "Identifier" && callee.name === "createInterpolateElement" ) ||
					( callee.type === "MemberExpression" && ! callee.computed && callee.property.name === "createInterpolateElement" ) ||
					( callee.type === "MemberExpression" && callee.computed && callee.property.type === "Literal" && callee.property.value === "createInterpolateElement" );

				if ( ! isCreateInterpolateElement ) {
					return;
				}

				let child = node;
				let ancestor = node.parent;
				while ( ancestor ) {
					if ( ancestor.type === "TryStatement" && ancestor.handler && ancestor.block === child ) {
						return;
					}
					child = ancestor;
					ancestor = ancestor.parent;
				}

				context.report( {
					node,
					messageId: "unsafeUsage",
				} );
			},
		};
	},
};
