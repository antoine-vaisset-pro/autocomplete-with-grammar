import {Error, Span, Token, TokenType} from "./model.js";

const KEYWORDS = {
  "OR": TokenType.OR,
  "AND": TokenType.AND,
  "IS": TokenType.IS,
  "NULL": TokenType.NULL,
  "NOW": TokenType.NOW,
  "EQ": TokenType.EQ,
  "NEQ": TokenType.NEQ,
  "LT": TokenType.LT,
  "LTE": TokenType.LTE,
  "GT": TokenType.GT,
  "GTE": TokenType.GTE,
  "IN": TokenType.IN,
  "LIKE": TokenType.LIKE,
  "NOT": TokenType.NOT,
};

export const EMPTY_SPAN: Span = {from: 0, to: 0};

export class Lexer {
  private position = 0;
  private startc: number = 0;
  private badCharsSpan: Span = EMPTY_SPAN;
  private badChars = "";

  constructor(private content: string, private reporter: Error) {
  }

  public nextToken(): Token {
    while (true) {
      this.startToken()
      let currentChar = this.nextChar();

      // end of file
      if (currentChar == '') {
        return this.token(TokenType.EOF);
      }

      if (currentChar == '\'' || currentChar == '\"') {
        return this.stringLiteral(currentChar);
      }

      if (this.isLetterOrLodash(currentChar)) {
        return this.keywordOrIdent(currentChar);
      }

      if (this.isDigit(currentChar)) {
        return this.number(currentChar);
      }

      // start block in parentheses
      if (currentChar == '(') {
        return this.token(TokenType.LPAR);
      }
      // end block in parentheses
      if (currentChar == ')') {
        return this.token(TokenType.RPAR);
      }
      // start array
      if (currentChar == '[') {
        return this.token(TokenType.LBRACE);
      }
      //end array
      if (currentChar == ']') {
        return this.token(TokenType.RBRACE);
      }


      if (currentChar == '=') {
        return this.token(TokenType.EQ);
      }

      // not or notEquals operators
      if (currentChar == '!') {
        let nextChar = this.nextChar();
        if (nextChar == '=') {
          // not equal operator
          return this.token(TokenType.NEQ);
        } else {
          // not operator (pushback next char that does not belong to this token)
          this.pushback(nextChar);
          return this.token(TokenType.NOT);
        }
      }

      // lowerThan, lowerThanOrEq, greaterThan, greaterThanOrEq operators
      if (currentChar == '<') {
        let nextChar = this.nextChar();
        if (nextChar == '=') {
          // lower than or equal operator
          return this.token(TokenType.LTE);
        } else {
          // lower than operator (pushback next char that does not belong to this token)
          this.pushback(nextChar);
          return this.token(TokenType.LT);
        }
      }
      if (currentChar == '>') {
        let nextChar = this.nextChar();
        if (nextChar == '=') {
          // lower than or equal operator
          return this.token(TokenType.GTE);
        } else {
          // lower than operator (pushback next char that does not belong to this token)
          this.pushback(nextChar);
          return this.token(TokenType.GT);
        }
      }

      if (!this.isSpace(currentChar)) {
        if (this.badChars == "") {
          this.badCharsSpan = this.makeSpan();
        } else {
          this.badCharsSpan = mergeSpan([this.badCharsSpan, this.makeSpan()]);
        }
        this.badChars += currentChar;
      }
    }
  }

  private flushBadChars() {
    if (this.badChars.length > 0) {
      let msg = "unexpected char '" + this.badChars + "'";
      this.reporter(this.badCharsSpan, msg);
      this.badChars = "";
    }
  }

  private keywordOrIdent(c: string) {
    let value = "";
    do {
      value += c;
      c = this.nextChar();
    } while (this.isLetterOrDigitOrLodash(c))
    this.pushback(c);
    // @ts-ignore
    let keyword = KEYWORDS[value];
    if (keyword) {
      return this.token(keyword);
    }
    return this.token(TokenType.IDENT, value);
  }

  private number(c: string) {
    let value = "";
    do {
      value += c;
      c = this.nextChar();
    } while (this.isDigit(c))
    if (c == '.') {
      value += c;
      c = this.nextChar();
      if (!this.isDigit(c)) {
        this.pushback(c);
        this.reporter(this.makeSpan(), "expected digit after decimal point");
        return this.token(TokenType.BAD);
      }
      do {
        value += c;
        c = this.nextChar();
      } while (this.isDigit(c))
    }
    this.pushback(c);

    //FIXME improve end of number detection, add support of sign and scientific notation.
    return this.token(TokenType.NUMBER, value);
  }

  private stringLiteral(separator: string) {
    let value = "";
    while (true) {
      let c = this.nextChar();
      if (c == separator) {
        break;
      }
      if (c == "" || c == "\n") {
        this.pushback(c);
        this.reporter(this.makeSpan(), "unterminated string");
        break;
      }
      value += c;
    }
    return this.token(TokenType.STRING_LITERAL, value);
  }

  private isLetterOrLodash(c: string) {
    return this.isLetter(c) || this.isLodash(c);
  }

  private isLetterOrDigitOrLodash(c: string) {
    return this.isLetter(c) || this.isDigit(c) || this.isLodash(c);
  }

  private isLodash(c: string) {
    return c == '_';
  }

  private isLetter(c: string) {
    return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z';
  }

  private isDigit(c: string) {
    return c >= '0' && c <= '9';
  }

  private isSpace(c: string) {
    return c == ' ' || c == '\t' || c == '\n';
  }

  private token(type: TokenType, value: string | null = null): Token {
    this.flushBadChars();
    if (value) {
      return {span: this.makeSpan(), type: type, value: value};
    }
    return {span: this.makeSpan(), type: type};
  }

  private startToken() {
    this.startc = this.position;
  }

  private makeSpan(): Span {
    return {
      from: this.startc,
      to: this.position
    };
  }

  private pushback(char: string) {
    if (char.length > 0) {
      --this.position;
    }
  }

  private nextChar(): string {
    if (this.position == this.content.length) {
      return "";
    }
    return this.content.charAt(this.position++);
  }
}


export function mergeSpan(spans: Span[]): Span {
  function minPosition(a: number, b: number): number {
    return Math.min(a, b);
  }

  function maxPosition(a: number, b: number): number {
    return Math.max(a, b);
  }

  function merge(a: Span, b: Span): Span {
    return {from: minPosition(a.from, b.from), to: maxPosition(a.to, b.to)};
  }

  let span: Span | null = null;
  spans.forEach(s => {
    if (span) {
      span = merge(span, s)
    } else {
      span = s;
    }
  })
  return span || EMPTY_SPAN;
}
