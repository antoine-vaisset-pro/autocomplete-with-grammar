export enum TokenType {
  IDENT = 'IDENT', // identifier
  STRING_LITERAL = 'STRING_LITERAL', // "string"
  NUMBER = 'NUMBER', // number with optional decimal point but without sign
  AND = 'AND', OR = 'OR', NOT = 'NOT', // boolean operators
  IS = 'IS', NULL = 'NULL', NOW = 'NOW', IN = 'IN', LIKE = 'LIKE', // keywords
  EQ = 'EQ', NEQ = 'NEQ', LT = 'LT', LTE = 'LTE', GT = 'GT', GTE = 'GTE', // comparison operators
  LPAR = 'LPAR', RPAR = 'RPAR', // parenthesis
  LBRACE = 'LBRACE', RBRACE = 'RBRACE', // array
  EOF = 'EOF',
  BAD = 'BAD', // bad token
}

export interface Token {
  span: Span;
  type: TokenType;
  value?: string;
}

export interface Span {
  from: number;
  to: number;
}

export interface Error {
  (span: Span, message: string): void;
}
