
import { GoogleGenAI, Type } from "@google/genai";
import { storageService } from './storageService.ts';

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
      const lang = localStorage.getItem('marah_app_language') || 'ar';
      let systemInstruction = `أنت المستشار التقني وكبير المهندسين الزراعيين لنظام "مراح" المتقدم. مهمتك: تقديم تحليل استراتيجي عالي المستوى لبيانات المزرعة. 1. حلل بيانات الـ GPS لاكتشاف أي شذوذ في الحركة. 2. اربط بين كميات العلف الموردة وإنتاجية الحليب. 3. قدم توصيات مالية بالدولار. 4. اكتشف حالات الحمل المحتملة. يجب أن تكون إجاباتك مهنية باللغة العربية.`;
      
      if (lang === 'en') {
        systemInstruction = `You are the technical advisor and chief agricultural engineer for the "Marah" advanced system. Your task: Provide high-level strategic analysis of farm data. 1. Analyze GPS data for anomalies. 2. Correlate feed quantities with milk production. 3. Provide financial recommendations in USD. 4. Detect potential pregnancy cases. Answer professionally in English.`;
      } else if (lang === 'tr') {
        systemInstruction = `Siz "Marah" gelişmiş sisteminin teknik danışmanı ve baş ziraat mühendisisiniz. Göreviniz: Çiftlik verilerinin üst düzey stratejik analizini sağlamak. 1. GPS verilerini anormallikler için analiz edin. 2. Yem miktarları ile süt üretimini ilişkilendirin. 3. USD cinsinden finansal önerilerde bulunun. 4. Olası gebelik durumlarını tespit edin. Türkçe olarak profesyonelce cevap verin.`;
      }

      // إنشاء نسخة جديدة لضمان استخدام أحدث مفتاح API من البيئة
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const payload = await this._gatherRealData();
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // استخدام البرو للمهام المعقدة
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 4096 }, // السماح للنموذج بالتفكير العميق قبل الرد
        },
        contents: [{ 
          role: 'user', 
          parts: [{ text: `Analyze this farm data and return a detailed JSON report: ${JSON.stringify(payload)}` }] 
        }]
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("AI Strategic Analysis Error:", error);
      const lang = localStorage.getItem('marah_app_language') || 'ar';
      let summary = 'حدث خطأ أثناء محاولة الوصول للعقل الاصطناعي. يرجى التأكد من اتصال الإنترنت.';
      let alertMsg = 'فشل الاتصال بالخادم الرئيسي';

      if (lang === 'en') {
        summary = 'Error accessing AI core. Please check internet connection.';
        alertMsg = 'Failed to connect to main server';
      } else if (lang === 'tr') {
        summary = 'Yapay zeka çekirdeğine erişim hatası. Lütfen internet bağlantısını kontrol edin.';
        alertMsg = 'Ana sunucuya bağlanılamadı';
      }

      return {
        status: 'error',
        summary: summary,
        alerts: [alertMsg]
      };
    }
  },

  /**
   * توليد تنبيهات ذكية وفورية بناءً على البيانات اللحظية
   */
  async generateSmartAlerts(language: string = 'ar') {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const payload = await this._gatherRealData();
      let systemInstruction = "أنت مراقب أمني وصحي فوري. حلل البيانات وأصدر مصفوفة JSON للتنبيهات الحالية فقط باللغة العربية.";
      
      if (language === 'en') {
        systemInstruction = "You are an immediate security and health monitor. Analyze data and output a JSON array of current alerts only in English.";
      } else if (language === 'tr') {
        systemInstruction = "Siz anlık bir güvenlik ve sağlık denetçisisiniz. Verileri analiz edin ve yalnızca mevcut uyarıları içeren bir JSON dizisi çıktısı verin (Türkçe).";
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // الفلاش سريع ومناسب للتنبيهات
        config: {
          systemInstruction: systemInstruction,
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
        contents: [{ role: 'user', parts: [{ text: `Analyze and extract alerts: ${JSON.stringify(payload)}` }] }]
      });

      return JSON.parse(response.text || '[]');
    } catch (e: any) {
      console.warn("AI Alerts Engine reported an issue:", e.message);
      return [];
    }
  }
};
