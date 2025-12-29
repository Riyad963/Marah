
/**
 * Marah Payment Service
 * Mock implementation to avoid network errors in demo environment.
 * Replaces real fetch calls with simulated success for UI testing.
 */

export const paymentService = {
  stripeKey: "pk_test_mock", 
  
  async createCheckoutSession(planId: string, userId: string) {
    try {
      // محاكاة وقت المعالجة والشبكة لواقعية تجربة المستخدم
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      console.log(`[Marah Payment] Mock Session Created for plan: ${planId}`);

      // تحديد اسم الباقة للعرض في الرسالة
      const planName = planId.includes('pro') ? 'Pro Plan (باقة المحترفين)' : 'Advanced Plan (الباقة المتقدمة)';
      
      // إظهار رسالة نجاح للمستخدم في النسخة التجريبية بدلاً من محاولة فتح Stripe
      alert(`[Marah Enterprise - Demo Mode]\n\nتمت محاكاة عملية الدفع بنجاح لـ ${planName}.\nرقم العملية: MRH-PY-${Date.now()}\n\nتم تفعيل ميزات الباقة في حسابك (تجريبياً).`);

      // إرجاع معرف جلسة وهمي
      return { id: "mock_session_id_" + Date.now() };
    } catch (e) {
      // في حال حدوث خطأ غير متوقع في المحاكاة
      console.error("Payment failed", e);
      throw e;
    }
  },

  async verifySubscription(userId: string): Promise<boolean> {
    // في النسخة التجريبية، نفترض دائماً أن المستخدم لديه اشتراك مفعل
    return true;
  }
};
