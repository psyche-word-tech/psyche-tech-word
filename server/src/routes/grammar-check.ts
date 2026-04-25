import { Router } from "express";
import axios from "axios";

const router = Router();

// 常见语法错误的详细中文解释
const errorExplanations: Record<string, { title: string; desc: string }> = {
  // 主谓一致
  'NON3PRS_VERB': { 
    title: '主谓不一致', 
    desc: '主语是 I/you/we/they 时，动词不能使用第三人称单数形式' 
  },
  'AGREEMENT_ERROR': { 
    title: '主谓不一致', 
    desc: '谓语动词需要与主语在人称和数上保持一致' 
  },
  'EN_A_AGREEMENT': { 
    title: '主谓不一致', 
    desc: '第三人称单数动词需要加 s' 
  },
  
  // 大小写
  'UPPERCASE_SENTENCE_START': { 
    title: '首字母大写', 
    desc: '句子开头字母应大写' 
  },
  
  // 空格问题
  'SENTENCE_WHITESPACE': { 
    title: '空格问题', 
    desc: '句首应添加空格' 
  },
  'WHITESPACE': { 
    title: '空格问题', 
    desc: '多余空格或缺少空格' 
  },
  'MULTIPLE_SPACES': { 
    title: '多余空格', 
    desc: '存在多个连续空格' 
  },
  
  // 标点符号
  'COMMA_PARENTHESIS': { 
    title: '标点符号', 
    desc: '括号内不需要逗号' 
  },
  'PUNCTUATION': { 
    title: '标点符号', 
    desc: '标点符号使用错误' 
  },
  'DOUBLE_PUNCTUATION': { 
    title: '重复标点', 
    desc: '连续标点符号' 
  },
  'UNPAIRED': { 
    title: '不成对标点', 
    desc: '引号或括号不成对' 
  },
  
  // 冠词
  'A_AN': { 
    title: '冠词错误', 
    desc: 'a/an 使用错误' 
  },
  'A_AN_UPPER': { 
    title: '冠词错误', 
    desc: '首字母大写时 a/an 使用错误' 
  },
  'THE_SUPERLATIVE': { 
    title: '冠词错误', 
    desc: '最高级前缺少定冠词 the' 
  },
  
  // 介词
  'PREPOSITION_USE': { 
    title: '介词错误', 
    desc: '介词使用错误' 
  },
  'INCORRECT_PREPOSITION': { 
    title: '介词错误', 
    desc: '介词搭配错误' 
  },
  
  // 拼写
  'MISSPELLING': { 
    title: '拼写错误', 
    desc: '单词拼写可能有误' 
  },
  'TYPO': { 
    title: '拼写错误', 
    desc: '可能的拼写错误' 
  },
  
  // 重复
  'WORD_REPEAT': { 
    title: '单词重复', 
    desc: '连续单词重复' 
  },
  'ENGLISH_WORD_REPEAT_RULE': { 
    title: '单词重复', 
    desc: '连续单词重复' 
  },
  
  // 时态
  'TENSES': { 
    title: '时态错误', 
    desc: '动词时态使用错误' 
  },
  'WRONG_FORM': { 
    title: '动词形式', 
    desc: '动词形式使用错误' 
  },
  
  // 撇号
  'APOS': { 
    title: '撇号错误', 
    desc: '撇号使用错误' 
  },
  'POSSESSIVE_APOSTROPHE': { 
    title: '所有格撇号', 
    desc: '所有格撇号使用错误' 
  },
  
  // 复数
  'PLURAL_FORM': { 
    title: '复数形式', 
    desc: '名词复数形式错误' 
  },
  
  // 形容词/副词
  'ADJECTIVE_ADVERB': { 
    title: '形容词/副词', 
    desc: '形容词和副词使用混淆' 
  },
  
  // 代词
  'PRONOUN_CASE': { 
    title: '代词形式', 
    desc: '主格/宾格代词使用错误' 
  },
  
  // 数量
  'MASS_AGREEMENT': { 
    title: '数量一致', 
    desc: '可数/不可数名词使用错误' 
  },
};

// 中文翻译函数
const translateToChinese = (message: string, ruleId: string): { title: string; desc: string } => {
  // 如果有规则 ID，优先使用规则解释
  if (ruleId && errorExplanations[ruleId]) {
    return errorExplanations[ruleId];
  }
  
  // 关键词匹配
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('pronoun') && lowerMessage.includes('third-person')) {
    return { title: '主谓不一致', desc: 'I/you/we/they 后应使用动词原形' };
  }
  if (lowerMessage.includes('capitalize') || lowerMessage.includes('uppercase')) {
    return { title: '首字母大写', desc: '句子开头字母应大写' };
  }
  if (lowerMessage.includes('space')) {
    return { title: '空格问题', desc: '空格使用不正确' };
  }
  if (lowerMessage.includes('comma')) {
    return { title: '逗号问题', desc: '逗号使用不正确' };
  }
  if (lowerMessage.includes('article') || lowerMessage.includes('a/an')) {
    return { title: '冠词错误', desc: 'a/an 使用错误' };
  }
  if (lowerMessage.includes('preposition')) {
    return { title: '介词错误', desc: '介词使用不正确' };
  }
  if (lowerMessage.includes('spelling') || lowerMessage.includes('spell')) {
    return { title: '拼写错误', desc: '单词拼写可能有误' };
  }
  if (lowerMessage.includes('repeated') || lowerMessage.includes('repeat')) {
    return { title: '单词重复', desc: '单词重复了' };
  }
  if (lowerMessage.includes('tense')) {
    return { title: '时态错误', desc: '动词时态不正确' };
  }
  if (lowerMessage.includes('apostrophe')) {
    return { title: '撇号错误', desc: '撇号使用不正确' };
  }
  if (lowerMessage.includes('plural')) {
    return { title: '复数形式', desc: '名词复数形式错误' };
  }
  if (lowerMessage.includes('subject') && lowerMessage.includes('verb')) {
    return { title: '主谓一致', desc: '谓语动词需要与主语一致' };
  }
  
  // 默认返回原消息
  return { title: '语法问题', desc: message };
};

// POST /api/v1/grammar-check - 语法检测
router.post("/", async (req, res) => {
  try {
    const { text, language = "en-US" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "缺少文本内容" });
    }

    // 使用 LanguageTool 公共 API 进行语法检测
    const response = await axios.post(
      "https://api.languagetool.org/v2/check",
      new URLSearchParams({
        text: text,
        language: language,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000,
      }
    );

    const { matches } = response.data;

    // 格式化检测结果（带中文翻译）
    const issues = matches.map((match: any) => {
      const ruleId = match.rule?.id || '';
      const { title, desc } = translateToChinese(match.message, ruleId);
      
      return {
        title: title,
        message: desc,
        originalMessage: match.message,
        shortMessage: match.shortMessage || title,
        offset: match.offset,
        length: match.length,
        rule: {
          id: ruleId,
          description: match.rule?.description,
        },
        replacements: match.replacements?.slice(0, 3) || [],
        context: {
          text: match.context?.text,
          offset: match.context?.offset,
          length: match.context?.length,
        },
      };
    });

    res.json({
      success: true,
      text,
      language,
      totalIssues: issues.length,
      issues,
      isCorrect: issues.length === 0,
    });
  } catch (error: any) {
    console.error("Grammar check error:", error.message);
    res.status(500).json({
      error: "语法检测失败，请稍后重试",
      details: error.message,
    });
  }
});

export default router;
