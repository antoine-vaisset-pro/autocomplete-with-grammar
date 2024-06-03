import {Lexer} from "./parser/lexer.js";
import {Token, TokenType} from "./parser/model.js";

let content = '(a <= 1) AND b LIKE "%test" OR c IS NULL AND d IN [1, 2, 3] OR e NOT IN (4, 5, 6) AND f = 1.5 OR g != "test"';
console.log("Content to parse: " + content);
let lexer = new Lexer(content, console.log);

let token: Token;
do {
  token = lexer.nextToken();
  console.dir(token);
} while (token.type != TokenType.EOF);
