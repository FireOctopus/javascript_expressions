"use strict";

let binOp = (f) => (a,b) => (x,y,z) => f(a(x,y,z),b(x,y,z));

let unOp = (f) => (a) => (x,y,z) => f(a(x,y,z));

let divide = binOp((a, b) =>  a / b);

let multiply = binOp((a, b) => a * b); 

let subtract = binOp((a, b) => a - b) ;

let add = binOp((a, b) => a + b);

let negate = unOp((a) => -a);

let cnst = (a) => (x,y,z) => a;

let variable = (a) => (x,y,z) => {
    switch (a) {
        case "x" : return x;
        case "y" : return y;
        case "z" : return z;
    }
};

let parse = function(expr) {
    let token = expr.trim().split(/\s+/);
    let stack = [];
    token.forEach(v => {
        switch (v) {
            case "x": case "y": case "z" : stack.push(variable(v)); break;
            case "negate": stack.push(negate(stack.pop())); break;
            case "+" : stack.push(add(stack.pop(), stack.pop())); break;
            case "*" : stack.push(multiply(stack.pop(), stack.pop())); break;
            case "/" : case "-": {
                let b = stack.pop();
                let a = stack.pop();
                stack.push(v === "/" ? divide(a, b) : subtract(a,b)); break;
            }
            default :
                stack.push(cnst(parseInt(v)));
        }
    });
    return stack.pop();
};