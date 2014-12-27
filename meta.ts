export class BaseNode {
    output () {
        throw new Error('Not implemented');
    }
}

export class ExpressionNode extends BaseNode {
}

export class StatementNode extends BaseNode {
}

export class Identifier extends ExpressionNode {

    constructor (private name: string) {
        super();
        if (!this.name.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/)) {
            throw new Error('Identifier name error: ' + this.name + ' is not a valid Identifier');
        }
    }

    output () {
        return this.name;
    }
}

export class LiteralNumber extends ExpressionNode {

    constructor (private value: number) {
        super();
    }

    output () {
        return String(this.value);
    }
}

export class MemberExpression extends ExpressionNode {

    constructor (private obj: ExpressionNode, private prop: ExpressionNode) {
        super();
    }

    output () {
        if (this.prop instanceof Identifier) {
            return this.obj.output() + '.' + this.prop.output();
        } else {
            return this.obj.output() + '[' + this.prop.output() + ']';
        }
    }
}

export class AssignmentExpression extends ExpressionNode {

    constructor (private operator: AssignmentOperator, private left: ExpressionNode, private right: ExpressionNode) {
        super();
    }

    output () {
        return this.left.output() + outputAssignmentOperator(this.operator) + this.right.output();
    }
}

export class CallExpression extends ExpressionNode {

    constructor (private callee: ExpressionNode, private arguments: ExpressionNode[]) {
        super();
    }

    output () {
        return this.callee.output() + '(' + this.arguments.map(arg => arg.output()).join(', ') + ')';
    }
}

export class ExpressionStatement extends StatementNode {

    constructor (private expression: ExpressionNode) {
        super();
    }

    output () {
        return this.expression.output() + ';';
    }
}

export enum AssignmentOperator {
    EQ
}

export class ReturnStatement extends StatementNode {

    constructor(private argument: ExpressionNode) {
        super();
    }

    output () {
        return 'return ' + this.argument.output() + ';'
    }
}

export class BlockStatement extends StatementNode {

    constructor(private body: StatementNode[]) {
        super();
    }

    output () {
        return '{' + this.body.map(statement => statement.output()).join('') + '}';
    }
}

export class Function extends ExpressionNode {

    constructor(private name: Identifier, private params: Identifier[], private body: StatementNode) {
        super();
    }

    output () {
        return 'function (' + this.params.map(param => param.output()).join(',') + ') ' + this.body.output();
    }
}

var assignmentOperatorMap: {[index: number]: string;} = {};

assignmentOperatorMap[AssignmentOperator.EQ] = '='

function outputAssignmentOperator(operator: AssignmentOperator): string {
    return assignmentOperatorMap[operator];
}
