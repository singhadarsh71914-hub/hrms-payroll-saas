import jsep from 'jsep';

const ALLOWED_FUNCTIONS = ['min', 'max', 'round', 'floor', 'ceil', 'coalesce'];
const ALLOWED_VARIABLES = [
  'ctc', 'gross', 'basic', 'hra', 'special', 
  'overtime_hours', 'sales_amount', 'commission_rate',
  'bonus_amount', 'performance_score'
];

export interface PayrollFormulaContext {
  basic?: number;
  hra?: number;
  special?: number;
  gross?: number;
  ctc?: number;
  overtime_hours?: number;
  sales_amount?: number;
  commission_rate?: number;
  bonus_amount?: number;
  performance_score?: number;
  [key: string]: number | undefined;
}

export class FormulaEngine {
  
  static validate(formula: string): { valid: boolean; error?: string } {
    try {
      const ast = jsep(formula);
      this._walk(ast, true);
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }

  static evaluate(formula: string, variables: PayrollFormulaContext): number {
    const ast = jsep(formula);
    return this._walk(ast, false, variables);
  }

  private static _walk(node: any, validateOnly: boolean, variables: PayrollFormulaContext = {}): number {
    switch (node.type) {
      case 'Literal':
        return Number(node.value);

      case 'Identifier': {
        if (!ALLOWED_VARIABLES.includes(node.name)) {
          throw new Error(`Unknown variable: ${node.name}`);
        }
        if (validateOnly) return 1;
        
        const val = variables[node.name];
        if (val === undefined || val === null) {
          throw new Error(`Unknown variable: ${node.name}`);
        }
        return Number(val);
      }

      case 'BinaryExpression': {
        const left = this._walk(node.left, validateOnly, variables);
        const right = this._walk(node.right, validateOnly, variables);
        if (validateOnly) return 1;
        
        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': 
            if (right === 0) return 0;
            return left / right;
          case '%': return left % right;
          default: throw new Error(`Unsupported operator: ${node.operator}`);
        }
      }

      case 'UnaryExpression': {
        const arg = this._walk(node.argument, validateOnly, variables);
        if (validateOnly) return 1;
        if (node.operator === '-') return -arg;
        if (node.operator === '+') return arg;
        throw new Error(`Unsupported unary operator: ${node.operator}`);
      }

      case 'CallExpression': {
        if (node.callee.type !== 'Identifier') {
          throw new Error('Only direct function calls are allowed');
        }
        const funcName = node.callee.name;
        if (!ALLOWED_FUNCTIONS.includes(funcName)) {
          throw new Error(`Unsupported function: ${funcName}`);
        }

        if (funcName === 'coalesce') {
          if (validateOnly) {
            node.arguments.forEach((arg: any) => this._walk(arg, validateOnly, variables));
            return 1;
          }
          
          for (const arg of node.arguments) {
            try {
              return this._walk(arg, validateOnly, variables);
            } catch (err: any) {
              if (err.message.startsWith('Unknown variable:')) {
                continue;
              }
              throw err;
            }
          }
          throw new Error('coalesce() evaluated to missing values completely');
        }

        const args = node.arguments.map((arg: any) => this._walk(arg, validateOnly, variables));
        if (validateOnly) return 1;

        switch (funcName) {
          case 'min': return Math.min(...args);
          case 'max': return Math.max(...args);
          case 'round': return Math.round(args[0] || 0);
          case 'floor': return Math.floor(args[0] || 0);
          case 'ceil': return Math.ceil(args[0] || 0);
          default: throw new Error(`Unsupported function: ${funcName}`);
        }
      }

      default:
        throw new Error(`Unsupported expression type: ${node.type}`);
    }
  }
}
