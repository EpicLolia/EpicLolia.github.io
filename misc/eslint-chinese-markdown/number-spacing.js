/**
 * @fileoverview ESLint rule for number spacing conventions in Markdown.
 *
 * Rules:
 * 1. missingSpace: Numbers (including currency prefix / percent suffix) must
 *    have a space between adjacent CJK characters.
 * 2. unexpectedSpace: No space between currency symbol and number, or between
 *    number and percent sign.
 *
 * A "number token" is: [currency]? digits([,]digits)* ([.]digits)? [%]?
 */

const CJK = '\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF';
const CURRENCY = '$¥€£';
const PERCENT = '%';

const CURRENCY_SPACE_RE = new RegExp(`([${CURRENCY}])\\s+(\\d)`, 'g');
const PERCENT_SPACE_RE = new RegExp(`(\\d)\\s+(${PERCENT})`, 'g');

const CJK_RE = new RegExp(`[${CJK}]`);
const NUM_TOKEN_RE = new RegExp(`[${CURRENCY}]?\\d[\\d,]*(\\.\\d+)?${PERCENT}?`, 'g');
const STRIP_CURRENCY_RE = new RegExp(`^[${CURRENCY}]`);
const STRIP_PERCENT_RE = new RegExp(`${PERCENT}$`);

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce spacing between numbers and CJK characters, no spacing within currency/percent expressions',
    },
    fixable: 'whitespace',
    messages: {
      missingSpace: 'Numbers must be separated from adjacent CJK text by a space.',
      unexpectedSpace: 'No space allowed between currency symbol and number, or number and percent sign.',
    },
  },

  create(context) {
    const { sourceCode } = context;

    function check(value, base) {
      // unexpectedSpace: currency/percent with space
      for (const re of [CURRENCY_SPACE_RE, PERCENT_SPACE_RE]) {
        for (const m of value.matchAll(re)) {
          const spaceStart = m.index + 1;
          let spaceEnd = spaceStart;
          while (spaceEnd < value.length && /\s/.test(value[spaceEnd])) spaceEnd++;
          context.report({
            loc: {
              start: sourceCode.getLocFromIndex(base + spaceStart),
              end: sourceCode.getLocFromIndex(base + spaceEnd),
            },
            messageId: 'unexpectedSpace',
            fix: (fixer) => fixer.removeRange([base + spaceStart, base + spaceEnd]),
          });
        }
      }

      // missingSpace: number token adjacent to CJK
      for (const m of value.matchAll(NUM_TOKEN_RE)) {
        const numPart = m[0].replace(STRIP_CURRENCY_RE, '').replace(STRIP_PERCENT_RE, '');
        const intPart = numPart.split('.')[0];
        if (intPart.includes(',') && !/^\d{1,3}(,\d{3})+$/.test(intPart)) continue;

        const start = m.index;
        const end = start + m[0].length;

        const reportInsertBefore = (index) => {
          context.report({
            loc: {
              start: sourceCode.getLocFromIndex(base + index),
              end: sourceCode.getLocFromIndex(base + index + 1),
            },
            messageId: 'missingSpace',
            fix: (fixer) => fixer.insertTextBeforeRange([base + index, base + index + 1], ' '),
          });
        };

        if (start > 0 && CJK_RE.test(value[start - 1])) {
          reportInsertBefore(start);
        }

        if (end < value.length && CJK_RE.test(value[end])) {
          reportInsertBefore(end);
        }
      }
    }

    return {
      ':matches(paragraph, heading, tableCell) text'(node) {
        let parent = node.parent;
        while (parent) {
          if (parent.type === 'inlineCode') return;
          parent = parent.parent;
        }
        check(sourceCode.getText(node), node.position.start.offset);
      },
    };
  },
};
