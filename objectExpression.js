"use strict";
function BinOp(a,b,op,f) {
    this.a = a;
    this.b = b;
}
BinOp.prototype.evaluate = function (x,y,z) {
    return this.f(this.a.evaluate(x,y,z), this.b.evaluate(x,y,z));
};
BinOp.prototype.toString = function() {
    return this.a + " " + this.b + " " + this.op;
};
BinOp.prototype.prefix = function() {
    return "(" + this.op + " " + this.a.prefix() + " " + this.b.prefix() + ")";
};

function UnOp(a, op, f) {
    this.a = a;
}
UnOp.prototype.evaluate = function (x,y,z) {
    return this.f(this.a.evaluate(x,y,z));
};
UnOp.prototype.toString = function() {
    return this.a + " " + this.op;
};
UnOp.prototype.prefix = function() {
    return "(" + this.op + " " + this.a.prefix() + ")";
};

function createBinOp(op, f) {
    const oper = Object.create(BinOp.prototype);
    oper.constructor = BinOp;
    oper.op = op;
    oper.f = f;
    return oper;
}

function createUnOp(op, f) {
    const oper = Object.create(UnOp.prototype);
    oper.constructor = UnOp;
    oper.op = op;
    oper.f = f;
    return oper;
}
function Add(a,b) {
    BinOp.call(this, a, b);
}
Add.prototype = createBinOp("+", (a,b) => a + b);

function Subtract(a,b) {
    BinOp.call(this, a, b);
}
Subtract.prototype = createBinOp( "-", (a, b) => a - b);

function Multiply(a,b) {
    BinOp.call(this, a, b);
}
Multiply.prototype = createBinOp( "*", (a, b) => a * b);

function Divide(a,b) {
    BinOp.call(this, a, b);
}
Divide.prototype = createBinOp( "/", (a, b) => a / b);


function Negate(a) {
    UnOp.call(this, a);
}
Negate.prototype = createUnOp( "negate", (a) => -a);

function ArcTan(a) {
    UnOp.call(this, a);
}
ArcTan.prototype = createUnOp( "atan", (a) => Math.atan(a));

function ArcTan2(a,b) {
    BinOp.call(this, a, b);
}
ArcTan2.prototype = createBinOp( "atan2", (a, b) => Math.atan2(a, b));

function Sinh(a) {
    UnOp.call(this, a);
}
Sinh.prototype = createUnOp( "sinh", (a) => Math.sinh(a));

function Cosh(a) {
    UnOp.call(this, a);
}
Cosh.prototype = createUnOp( "cosh", (a) => Math.cosh(a));

function Const (value) {
    this.value = value;
}

Const.prototype.evaluate = function (x,y,z) {
    return this.value;
};
Const.prototype.toString = Const.prototype.prefix = function() {
    return this.value.toString();
};

function Variable(name) {
    this.name = name;
}
Variable.prototype.evaluate = function (x,y,z) {
    switch (this.name) {
        case "x" : return x;
        case "y" : return y;
        case "z" : return z;
    }
};
Variable.prototype.toString = Variable.prototype.prefix = function() {
    return this.name;
};

function ParseError(message) {
    Error.call(this, message);
    this.message = message;
}
ParseError.prototype = Object.create(Error.prototype);
ParseError.prototype.name = "ParseError";
ParseError.prototype.constructor = ParseError;

const isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');

const isDigit = (c) => c >= '0' && c <= '9';

const isConst = (string) => {
    let cnst = parseInt(string); 
    return !isNaN(cnst) && cnst.toString() == string; 
};

const isWhitespace = (string) => /\s+/.test(string);

const sameType = (a, b, string) => (isLetter(string[a]) && isLetter(string[b]) || 
                                    (isDigit(string[a]) || string[a] === '-') && isDigit(string[b]) || 
                                    string[a] === " " && string[b] === " ");
const OPERATORS = {
    "negate": [Negate, 1], 
    "atan" : [ArcTan, 1], 
    "sinh" : [Sinh, 1], 
    "cosh" : [Cosh, 1],
    "+" : [Add, 2], 
    "-" : [Subtract, 2], 
    "*" : [Multiply, 2], 
    "/" : [Divide, 2],
    "atan2": [ArcTan2, 2]
};
const VARS = ["x","y","z"];

let parseExpr = function(expr, isPost) {
    if (expr === "" || expr === "()") {
        throw new ParseError("Empty expression");
    }
    let token = splitExpr(expr);
    let oB, cB;
    oB = cB = 0;
    let stack = [];
    let prev = "";
    token.forEach(v => {
        if (v in OPERATORS) {
           if (stack.length < OPERATORS[v][1]) {
                throw new ParseError("For operator {" + 
                                        v + "} expected " + 
                                        OPERATORS[v][1] + " operand" + 
                                        (OPERATORS[v][1] > 1 ? "s" : "") +
					", but found " + stack.length);
            }
            let args = [];
            for (let i = 0; i < OPERATORS[v][1]; i++) {
                args.push(stack.pop());
            }
            if (isPost) {
                args.reverse();
            }
            stack.push(new OPERATORS[v][0](...args));
        } else if (VARS.includes(v)) {
            stack.push(new Variable(v));
        } else if (isConst(v)) {
            stack.push(new Const(parseInt(v)));
        } else if (v === "(") {
            oB++;
        } else if (v === ")") {
            cB++;
            if (prev === "(") {
                throw new ParseError("Empty brackets");
            }
        } else if (!isWhitespace(v)) {
            throw new ParseError("Unknown token: " + v);
        }
        prev = v;
    });
    if (oB !== cB) {
        throw new ParseError (oB > cB ? "Expected closing bracket" : "Unexpected closing bracket");
    }
    let check = stack[0].toString();
    if (oB !== 0 && (VARS.includes(check) || isConst(check))) {
        throw new ParseError ("In brackets expected operation, found " + 
				(VARS.includes(check) ? "variable " :
				"constant ") + check);
    } 
    if (stack.length > 1) {
        throw new ParseError ("Expected operator");
    }    
    return stack.pop();
};

const splitExpr = function(string) {
    if (string.length === 1) return [string];
    let i = 1;
    string.replaceAll("atan2", "atanb");
    while (i < string.length) {
        while(sameType(i-1,i,string)) i++;
        let a = string.substring(0,i);
        let b = string.substring(i);
        if (b !== "") {
            string = a + "$" + b;
            i += 2;
        }
    }
    string.replaceAll("atanb", "atan2");
    return string.split("$");
};

const reverse = (string) => splitExpr(string).reverse().join("").replaceAll("(", "$").replaceAll(")", "(").replaceAll("$", ")");

let parsePrefix = (expr) => parseExpr(reverse(expr), false);

let parse = (expr) => parseExpr(expr, true);