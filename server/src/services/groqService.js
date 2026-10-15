const https = require('https');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const AIActionLog = require('../models/AIActionLog');
const inventoryService = require('./inventoryService');
const reportService = require('./reportService');

/**
 * Dukaan Sahayak — Google Gemma 4 AI Service
 * Uses Google Gemma 4 (gemma-4-26b-a4b-it) via Gemini API OpenAI-compatible endpoint
 * Authentication: Bearer token with AQ. key format
 *
 * MLH Gemma Challenge — Best Use of Gemma 4 💎
 * Model: gemma-4-26b-a4b-it via Google Gemini API
 */

const GEMMA_MODEL = process.env.GEMMA_MODEL || 'models/gemma-4-26b-a4b-it';
const GEMINI_HOST = 'generativelanguage.googleapis.com';
const GEMINI_PATH = '/v1beta/openai/chat/completions';

/**
 * System prompt — Hindi/Hinglish aware Kirana shop assistant
 */
const SYSTEM_PROMPT = `You are Dukaan Sahayak (दुकान सहायक), an AI assistant for small Indian Kirana shop owners.
You understand Hindi, Hinglish (Hindi+English mixed), and English fluently.
You help shopkeepers with: sales billing, purchases, inventory tracking, udhar/khata (customer credit ledgers), expenses, and business analytics.

IMPORTANT: Always respond DIRECTLY without any thinking or reasoning steps. Give your answer immediately.

When responding:
1. Always reply in the SAME language the shopkeeper used (Hindi/Hinglish/English)
2. Be concise and practical — like a trusted shop assistant
3. Use ₹ for all rupee amounts
4. Format numbers clearly (e.g., ₹1,500 not 1500)
5. When showing product lists, be clear and organized
6. When asked about sales/stock/customers, present the data in a readable format
7. If something is missing (like product name or quantity), politely ask for it
8. Keep responses short — shopkeepers are busy people!

You have access to shop data including products, customers, inventory, sales reports, and expenses.`;

/**
 * Make an OpenAI-compatible API call to Gemini/Gemma
 */
const callGemmaAPI = (apiKey, messages, maxTokens = 1000) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: GEMMA_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const options = {
      hostname: GEMINI_HOST,
      path: GEMINI_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          // Gemini wraps response in an array sometimes
          const parsed = JSON.parse(data);
          const result = Array.isArray(parsed) ? parsed[0] : parsed;

          if (result.error) {
            reject(new Error(`Gemma API Error: ${result.error.message}`));
            return;
          }

          const content = result.choices?.[0]?.message?.content || '';
          // Gemma 4 uses <thought>...</thought> for chain-of-thought reasoning
          // The actual answer comes AFTER the </thought> tag
          let cleaned = content;
          if (content.includes('</thought>')) {
            // Take everything after the last </thought> tag
            const afterThought = content.split('</thought>').pop() || '';
            cleaned = afterThought.trim();
            // If nothing after thought, strip the thought block and use what's inside
            if (!cleaned) {
              cleaned = content.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();
            }
          }
          // Final fallback — strip any remaining thought tags
          cleaned = cleaned.replace(/<\/?thought>/g, '').trim();
          resolve(cleaned || 'Maaf kijiye, response generate nahi ho saka. Dobara try karein.');
        } catch (e) {
          reject(new Error(`Failed to parse Gemma response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Gemma API timeout'));
    });
    req.write(body);
    req.end();
  });
};

/**
 * Build context string from shop data for the AI
 */
const buildShopContext = async (shopId, userMessage) => {
  const contextParts = [];
  const msg = userMessage.toLowerCase();

  try {
    // Fetch relevant data based on message keywords
    const isStockQuery = /stock|inventory|maal|saman|kitna hai|available/i.test(userMessage);
    const isReportQuery = /sales|bikri|report|aaj|today|week|month|revenue|profit/i.test(userMessage);
    const isCustomerQuery = /customer|khata|udhar|balance|credit|naam|phone/i.test(userMessage);
    const isProductQuery = /product|item|price|rate|daam|kya bechte/i.test(userMessage);

    if (isStockQuery || isProductQuery) {
      const products = await Product.find({ shopId })
        .limit(20)
        .select('name currentStock sellingPrice unit reorderLevel aliases');
      if (products.length > 0) {
        const lowStock = products.filter((p) => p.currentStock <= p.reorderLevel);
        contextParts.push(`📦 SHOP PRODUCTS (${products.length} total):`);
        products.forEach((p) => {
          const stockStatus = p.currentStock <= 0 ? '❌ OUT' : p.currentStock <= p.reorderLevel ? '⚠️ LOW' : '✅';
          contextParts.push(
            `  - ${p.name}: Stock=${p.currentStock} ${p.unit}, Price=₹${p.sellingPrice}, Reorder at ${p.reorderLevel} ${stockStatus}`
          );
        });
        if (lowStock.length > 0) {
          contextParts.push(`\n⚠️ LOW STOCK ALERT: ${lowStock.map((p) => p.name).join(', ')}`);
        }
      }
    }

    if (isCustomerQuery) {
      const customers = await Customer.find({ shopId })
        .limit(10)
        .select('name phone outstandingBalance');
      if (customers.length > 0) {
        contextParts.push(`👥 CUSTOMERS WITH BALANCE:`);
        const withBalance = customers.filter((c) => c.outstandingBalance > 0);
        withBalance.forEach((c) => {
          contextParts.push(`  - ${c.name} (${c.phone || 'no phone'}): Owes ₹${c.outstandingBalance}`);
        });
        if (withBalance.length === 0) {
          contextParts.push(`  All customers have cleared their dues. Total customers: ${customers.length}`);
        }
      }
    }

    if (isReportQuery) {
      try {
        const summary = await reportService.getDailySummary(shopId, new Date());
        contextParts.push(`📊 TODAY'S REPORT:`);
        contextParts.push(`  - Total Sales: ₹${summary.totalSales || 0}`);
        contextParts.push(`  - Total Revenue: ₹${summary.totalRevenue || 0}`);
        contextParts.push(`  - Expenses: ₹${summary.totalExpenses || 0}`);
        contextParts.push(`  - Estimated Profit: ₹${summary.estimatedProfit || 0}`);
      } catch (e) {
        // Report might fail for new shops with no data
        contextParts.push(`📊 TODAY'S REPORT: No sales recorded yet today.`);
      }
    }
  } catch (e) {
    // Context building errors are non-critical
    console.error('[GemmaService] Context build error:', e.message);
  }

  return contextParts.length > 0
    ? `\n\n=== SHOP DATA (use this to answer the question) ===\n${contextParts.join('\n')}\n=== END SHOP DATA ===\n`
    : '';
};

/**
 * Detect if the user wants to record an expense
 */
const detectExpense = async (shopId, userId, userMessage) => {
  const expensePattern = /(\d+(?:\.\d+)?)\s*(?:rupaye?|rs\.?|₹)?\s*(?:ka|ki|ke)?\s*(electricity|bijli|rent|kiraya|petrol|diesel|salary|maintenance|repair|supplies|other|misc)/i;
  const amountFirst = /(?:₹|rs\.?|rupaye?)?\s*(\d+(?:\.\d+)?)\s*(?:expense|kharcha|kharch|spend)/i;

  const match = userMessage.match(expensePattern) || userMessage.match(amountFirst);
  if (match && /expense|kharcha|kharch|lagaya|diya|pay/i.test(userMessage)) {
    const amount = parseFloat(match[1]);
    const category = match[2] || 'other';
    if (amount > 0) {
      const expense = new Expense({
        shopId,
        category: category.toLowerCase(),
        amount,
        description: userMessage,
        createdBy: userId,
        date: new Date(),
      });
      await expense.save();
      return expense;
    }
  }
  return null;
};

/**
 * Main function: Process a shopkeeper message using Google Gemma 4
 *
 * @param {string} shopId
 * @param {string} userId
 * @param {string} userMessage
 * @param {Array}  conversationHistory - [{role, content}]
 * @returns {Promise<{message, toolCalls, structuredData}>}
 */
const processMessage = async (shopId, userId, userMessage, conversationHistory = []) => {
  const apiKey = process.env.GEMINI_API_KEY;

  // Graceful offline fallback
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      message:
        'Namaste! 🛒 Dukaan Sahayak AI (powered by Google Gemma 4 💎) is ready to help! Please add your GEMINI_API_KEY to the .env file to activate AI features. Get your free key at https://aistudio.google.com',
      toolCalls: [],
      structuredData: null,
    };
  }

  let executedTools = [];
  let recordedExpense = null;

  try {
    // Step 1: Auto-detect and record expense if mentioned
    try {
      recordedExpense = await detectExpense(shopId, userId, userMessage);
    } catch (_) {}

    // Step 2: Build context from shop database
    const shopContext = await buildShopContext(shopId, userMessage);

    // Step 3: Build message array for Gemma
    const systemWithContext = SYSTEM_PROMPT + shopContext;

    const messages = [
      { role: 'system', content: systemWithContext },
      // Include recent conversation history (last 6 messages)
      ...conversationHistory.slice(-6).map((h) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content,
      })),
      { role: 'user', content: userMessage },
    ];

    // Step 4: Call Gemma 4 via Gemini API
    const responseText = await callGemmaAPI(apiKey, messages, 1000);

    // Step 5: Check for sale/billing intent
    let structuredData = null;
    const isSaleIntent = /bill|invoice|becho|bechna|sale|banega|banao|bikri kar/i.test(userMessage);
    if (isSaleIntent) {
      // Try to extract product names mentioned
      const products = await Product.find({ shopId }).limit(30).select('name _id sellingPrice unit currentStock');
      const mentionedProducts = products.filter((p) =>
        userMessage.toLowerCase().includes(p.name.toLowerCase())
      );
      if (mentionedProducts.length > 0) {
        structuredData = {
          type: 'sale_suggestion',
          products: mentionedProducts,
          message: 'Billing page pe ja ke ye sale confirm kar sakte hain',
        };
        executedTools.push({ tool: 'sale_detection', products: mentionedProducts });
      }
    }

    // Step 6: Log action
    try {
      await AIActionLog.create({
        shopId,
        userId,
        input: userMessage,
        intent: isSaleIntent ? 'create_sale' : 'general_query',
        tool: recordedExpense ? 'record_expense' : 'chat',
        toolArgs: { shopContext: shopContext.length > 0 },
        result: { responseLength: responseText.length },
        status: 'success',
        timestamp: new Date(),
      });
    } catch (_) {}

    // Add expense confirmation to response if recorded
    let finalMessage = responseText;
    if (recordedExpense) {
      finalMessage = `✅ Expense recorded: ₹${recordedExpense.amount} (${recordedExpense.category})\n\n${responseText}`;
      executedTools.push({ tool: 'record_expense', amount: recordedExpense.amount });
    }

    return {
      message: finalMessage,
      toolCalls: executedTools,
      structuredData,
      model: GEMMA_MODEL,
    };
  } catch (error) {
    console.error('[GemmaService] Error:', error.message);

    // Log failure
    try {
      await AIActionLog.create({
        shopId,
        userId,
        input: userMessage,
        intent: 'error',
        tool: 'none',
        toolArgs: null,
        result: { error: error.message },
        status: 'error',
        timestamp: new Date(),
      });
    } catch (_) {}

    // User-friendly error message in Hinglish
    return {
      message:
        'Maaf kijiye, abhi AI se connect karne mein dikkat aa rahi hai. Thodi der baad try karein. 🙏',
      toolCalls: [],
      structuredData: null,
      error: error.message,
    };
  }
};

module.exports = {
  SYSTEM_PROMPT,
  GEMMA_MODEL,
  processMessage,
};
