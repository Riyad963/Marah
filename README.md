
# Marah Livestock App - دليل التثبيت والبناء

## 1. إعداد المشروع (الخطوة الأولى)
تأكد من تثبيت المكتبات وتشغيل البناء الأولي:
```bash
npm install
npm run build
```

---

## 2. بناء ملف Android (APK)
1. **إضافة منصة الأندرويد ومزامنة الملفات:**
   ```bash
   npx cap add android
   npx cap sync
   ```
2. **فتح المشروع في Android Studio:**
   ```bash
   npx cap open android
   ```
3. **استخراج ملف APK:**
   - داخل Android Studio، اذهب إلى القائمة العلوية:
   - `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
   - سيظهر إشعار عند الانتهاء بمكان الملف.

---

## 3. بناء ملف iOS (IPA) - *يتطلب جهاز Mac*
1. **إضافة منصة iOS ومزامنة الملفات:**
   ```bash
   npx cap add ios
   npx cap sync
   ```
2. **فتح المشروع في Xcode:**
   ```bash
   npx cap open ios
   ```
3. **تشغيل التطبيق أو الأرشفة:**
   - اختر جهاز المحاكاة أو جهازك المتصل.
   - اضغط زر التشغيل (Play) للاختبار.
   - لإنشاء ملف للنشر: اذهب إلى `Product` > `Archive`.

---

## ملاحظات هامة
* **الأيقونات والشاشات:** تأكد من استبدال الأيقونات الافتراضية في مجلدات `android/app/src/main/res` و `ios/App/App/Assets.xcassets`.
* **الأذونات:** تم إعداد `capacitor.config.json` والملفات الأساسية، لكن قد تحتاج لمراجعة `Info.plist` (للـ iOS) و `AndroidManifest.xml` (للـ Android) إذا أضفت ميزات جديدة تتطلب أذونات (مثل الكاميرا أو الموقع).
