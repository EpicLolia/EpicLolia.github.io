/**
 * @fileoverview ESLint rule for CJK-Latin spacing conventions in Markdown.
 *
 * Rules:
 * 1. missingSpace: CJK and Latin letters must have a space between them.
 * 2. unexpectedSpace: No space before or after CJK punctuation.
 */

const CJK = '\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF';
const CJK_PUNCT = '，。！？；：、「」『』（）【】《》〈〉“”‘’…—～·';
const LATIN = 'a-zA-Z';

const CJK_LATIN_RE = new RegExp(`([${CJK}])([${LATIN}])|([${LATIN}])([${CJK}])`, 'g');
const SPACE_PUNCT_RE = new RegExp(`\\s+([${CJK_PUNCT}])|([${CJK_PUNCT}])\\s+`, 'g');

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce spacing between CJK and Latin characters, and no spacing around CJK punctuation',
    },
    fixable: 'whitespace',
    messages: {
      missingSpace: 'CJK and Latin content must be separated by a space.',
      unexpectedSpace: 'No space allowed around CJK punctuation.',
    },
  },

  create(context) {
    const { sourceCode } = context;

    function check(value, base) {
      for (const m of value.matchAll(CJK_LATIN_RE)) {
        const idx = m.index + 1;
        context.report({
          loc: {
            start: sourceCode.getLocFromIndex(base + idx),
            end: sourceCode.getLocFromIndex(base + idx + 1),
          },
          messageId: 'missingSpace',
          fix: (fixer) => fixer.insertTextBeforeRange([base + idx, base + idx + 1], ' '),
        });
      }

      for (const m of value.matchAll(SPACE_PUNCT_RE)) {
        const spaceStart = m[1] ? m.index : m.index + 1;
        const spaceEnd = m[1] ? m.index + m[0].length - 1 : m.index + m[0].length;
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
