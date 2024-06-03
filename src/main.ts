import {Lexer, Token, TokenType} from "./parser/lexer.js";

let content = '(a = 1) AND b LIKE "%test"';
console.log("Content to parse: " + content);
let lexer = new Lexer(content, console.log);

let token: Token;
do {
  token = lexer.nextToken();
  console.dir(token);
} while (token.type != TokenType.EOF);
