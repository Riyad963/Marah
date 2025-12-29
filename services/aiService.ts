
import { GoogleGenAI, Type } from "@google/genai";
import { storageService } from './storageService.ts';

const ADVISOR_SYSTEM_INSTRUCTION = `
أنت المستشار التقني وكبير المهندسين الزراعيين لنظام "مراح" المتقدم.
مهمتك: تقديم تحليل استراتيجي عالي المستوى لبيانات المزرعة.
1. حلل بيانات الـ GPS لاكتشاف أي شذوذ في الحركة (خمول، ركض مفاجئ، خروج عن المسار).
2. اربط بين كميات العلف الموردة وبين عدد الرؤوس وإنتاجية الحليب.
3. قدم توصيات مالية بالدولار (USD) لتقليل التكاليف وزيادة الأرباح.
4. اكتشف حالات الحمل المحتملة أو اقتراب موعد الولادة بناءً على سجلات التزاوج.
يجب أن تكون إجاباتك مهنية، دقيقة، ومبنية على منطق زراعي وتقني سليم.
`;

export const aiService = {
  // دالة داخلية لجمع البيانات الحقيقية من المخزن المحلي
  async _gatherRealData() {
      const herd = await storageService.load('marah_livestock', []);
      const feed = await storageService.load('marah_feed', []);
      const tracking = await storageService.load('marah_devices', []);
      const sales = await storageService.load('marah_sales', []);
      
      return { 
        herd, 
        feed, 
        tracking, 
        sales,
        timestamp: new Date().toISOString() 
      };
  },

  /**
   * تحليل شامل للحالة العامة للمزرعة باستخدام Gemini 3 Pro
   */
  async analyzeFarmStatus() {
    try {
      // إنشاء نسخة جديدة لضمان استخدام أحدث مفتاح API من البيئة
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const payload = await this._gatherRealData();
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // استخدام البرو للمهام المعقدة
        config: {
          systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 4096 }, // السماح للنموذج بالتفكير العميق قبل الرد
        },
        contents: [{ 
          role: 'user', 
          parts: [{ text: `قم بتحليل هذه البيانات الشاملة للمزرعة وأعطِ تقريراً إدارياً مفصلاً بصيغة JSON: ${JSON.stringify(payload)}` }] 
        }]
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("AI Strategic Analysis Error:", error);
      return {
        status: 'error',
        summary: 'حدث خطأ أثناء محاولة الوصول للعقل الاصطناعي. يرجى التأكد من اتصال الإنترنت.',
        alerts: ['فشل الاتصال بالخادم الرئيسي']
      };
    }
  },

  /**
   * توليد تنبيهات ذكية وفورية بناءً على البيانات اللحظية
   */
  async generateSmartAlerts() {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const payload = await this._gatherRealData();
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // الفلاش سريع ومناسب للتنبيهات
        config: {
          systemInstruction: "أنت مراقب أمني وصحي فوري. حلل البيانات وأصدر مصفوفة JSON للتنبيهات الحالية فقط. ركز على الحالات الطارئة.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                action: { type: Type.STRING },
                severity: { type: Type.STRING, description: "low, medium, or high" },
                type: { type: Type.STRING, description: "أمني, صحي, or إداري" }
              },
              required: ["title", "description", "severity", "type"]
            }
          }
        },
        contents: [{ role: 'user', parts: [{ text: `حلل البيانات التالية واستخرج التنبيهات: ${JSON.stringify(payload)}` }] }]
      });

      return JSON.parse(response.text || '[]');
    } catch (e: any) {
      console.warn("AI Alerts Engine reported an issue:", e.message);
      return [];
    }
  },

  /**
   * إصدار تقارير إدارية نصية مفصلة للملاك
   */
  async generateAdministrativeReport(period: string = 'الحالي') {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const payload = await this._gatherRealData();
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        config: {
          thinkingConfig: { thinkingBudget: 2048 }
        },
        contents: [{ 
          role: 'user', 
          parts: [{ text: `قم بصياغة تقرير إداري بليغ للتقرير ${period} للمالك بناءً على هذه المعطيات: ${JSON.stringify(payload)}` }] 
        }]
      });
      return response.text;
    } catch (e) {
      return "عذراً، المستشار الذكي مشغول حالياً بتحليل البيانات الضخمة. حاول مرة أخرى لاحقاً.";
    }
  }
};
