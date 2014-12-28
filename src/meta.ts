export class BaseNode {
    output (): string {
        throw new Error('Not implemented');
    }
}

export class ExpressionNode extends BaseNode {

    member (right: ExpressionNode) {
        return new MemberExpression(this, right);
    }

    index (right: ExpressionNode) {
        return new MemberExpression(this, right, true);
    }

    call (...args: ExpressionNode[]) {
        return new CallExpression(this, args);
    }

    binary (operator: string, right: ExpressionNode) {
        return new BinaryExpression(operator, this, right);
    }

    parenthesis () {
        return new ParenthesisExpression(this);
    }

    toStatement (): ExpressionStatement {
        return new ExpressionStatement(this);
    }

    assign (right: ExpressionNode): AssignmentExpression;
    assign (operator: AssignmentOperator, right: ExpressionNode): AssignmentExpression;
    assign (operatorOrRight: any, right?: ExpressionNode) {
        if (right) {
            return new AssignmentExpression(operatorOrRight, this, right);
        }
        return new AssignmentExpression(AssignmentOperator.EQ, this, operatorOrRight);
    }
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

    constructor (private obj: ExpressionNode, private prop: ExpressionNode, private forceIndex: boolean = false) {
        super();
    }

    output () {
        if (!this.forceIndex && this.prop instanceof Identifier) {
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

export class BinaryExpression extends ExpressionNode {

    constructor (private operator: string, private left: ExpressionNode, private right: ExpressionNode) {
        super();
    }

    output () {
        return this.left.output() + this.operator + this.right.output();
    }
}

export class NewExpression extends ExpressionNode {

    constructor (private callee: ExpressionNode, private arguments: ExpressionNode[] = []) {
        super();
    }

    output () {
        return 'new ' + this.callee.output() + '(' + this.arguments.map(arg => arg.output()).join(', ') + ')';
    }
}

export class ParenthesisExpression extends ExpressionNode {

    constructor (private expression: ExpressionNode) {
        super();
    }

    output () {
        return '(' + this.expression.output() + ')';
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

export class ForStatement extends StatementNode {

    constructor (private init: StatementNode, private test: ExpressionNode, private update: ExpressionNode, private body: StatementNode) {
        super();
    }

    output (): string {
        return 'for (' + this.init.output() + this.test.output() + ';' + this.update.output() + ')' + this.body.output();
    }
}

export class VariableDeclaration extends StatementNode {

    constructor(private declarations: OneVariableDeclaration[]) {
        super();
    }

    output () {
        return 'var ' + this.declarations.map(this._outputOneDeclaration).join(',') + ';';
    }

    private _outputOneDeclaration (declaration: OneVariableDeclaration): string {
        var result = declaration.name.output();
        if (declaration.init) {
            result += '=' + declaration.init.output();
        }
        return result;
    }
};

export interface OneVariableDeclaration {
    name: Identifier;
    init: ExpressionNode;
}

export class UnaryExpression extends ExpressionNode {

    constructor (private operator: string, private prefix: boolean, private argument: ExpressionNode) {
        super();
    }

    output () {
        var result: string = this.argument.output();
        if (this.prefix) {
            result = this.operator + result;
        } else {
            result += this.operator;
        }
        return result;
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
