import { LLMClient, Config } from "coze-coding-dev-sdk";
import { Client } from "pg";

const config = new Config();
const client = new LLMClient(config);

const db = new Client({
  connectionString: process.env.DATABASE_URL || "postgres://coze:coze@localhost:5432/coze"
});

async function generateExamples() {
  await db.connect();
  
  // 获取所有单词
  const res = await db.query('SELECT id, word, meaning FROM words_a WHERE example IS NULL OR example = \'\'');
  const words = res.rows;
  
  console.log(`Found ${words.length} words without examples`);
  
  for (const word of words) {
    try {
      const prompt = `为以下单词生成一个简单的英文例句和中文翻译。

单词: ${word.word}
释义: ${word.meaning}

请按以下格式返回（不要加引号）：
例句: [英文例句]
翻译: [中文翻译]

要求：
- 例句要简短、自然，10-20个单词
- 例句要能体现单词的意思
- 中文翻译要准确、通顺`;

      const response = await client.invoke(
        [{ role: "user", content: prompt }],
        { model: "doubao-seed-1-6-lite-251015", temperature: 0.3 }
      );

      const content = response.content;
      
      // 解析例句和翻译
      const exampleMatch = content.match(/例句:\s*(.+?)(?=翻译:|$)/s);
      const translationMatch = content.match(/翻译:\s*(.+)/s);
      
      if (exampleMatch && translationMatch) {
        const example = exampleMatch[1].trim().replace(/^["']|["']$/g, '');
        const translation = translationMatch[1].trim().replace(/^["']|["']$/g, '');
        
        await db.query(
          'UPDATE words_a SET example = $1, example_translation = $2 WHERE id = $3',
          [example, translation, word.id]
        );
        
        console.log(`✓ ${word.word}: ${example}`);
      } else {
        console.log(`✗ ${word.word}: Failed to parse response`);
      }
    } catch (error) {
      console.error(`✗ ${word.word}: Error -`, error.message);
    }
    
    // 避免请求过快
    await new Promise(r => setTimeout(r, 500));
  }
  
  await db.end();
  console.log('Done!');
}

generateExamples().catch(console.error);
