<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QUANTIX</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f7;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#523859;padding:20px 32px;text-align:center;">
<span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">QUANTIX</span>
</td></tr>

{{-- Arabic Section FIRST --}}
<tr><td dir="rtl" style="padding:32px;background:#ffffff;text-align:right;">
@php
  $isTrial = $eventType === 'app.trial.started';
  $appAr = $appDisplayAr;
  $appEn = $appDisplayEn;
@endphp
@if($appName === 'harees')
  @if($isTrial)
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">مرحباً بك في {{ $appAr }} — بدأت فترتك التجريبية 🎉</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;">شكراً لاختيارك <strong>{{ $appAr }}</strong> من QUANTIX. تم تفعيل الفترة التجريبية بنجاح.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;"><strong>{{ $appAr }}</strong> يساعدك على متابعة تواريخ انتهاء المنتجات تلقائياً، وتنظيم الدُفعات، وتطبيق الخصومات قبل الانتهاء، وإخفاء المنتجات المنتهية — لتقليل الهدر وزيادة رضا العملاء.</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#374151;">ابدأ الآن بإضافة دُفعاتك الأولى وتجربة لوحة التحكم.</p>
  @else
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">تم تفعيل اشتراكك في {{ $appAr }} بنجاح ✅</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;">شكراً لثقتك بـ QUANTIX. اشتراكك في <strong>{{ $appAr }}</strong> أصبح نشطاً الآن.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;"><strong>{{ $appAr }}</strong> يتولى عنك مراقبة الصلاحيات، والخصومات التلقائية، والمزامنة مع سلة — لتعمل بشكل آلي وموثوق.</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#374151;">يمكنك الآن الاستفادة الكاملة من جميع المزايا.</p>
  @endif
@else
  @if($isTrial)
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">مرحباً بك في {{ $appAr }} — بدأت فترتك التجريبية 🎉</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;">شكراً لاختيارك <strong>{{ $appAr }}</strong> من QUANTIX. تم تفعيل الفترة التجريبية بنجاح.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;"><strong>{{ $appAr }}</strong> يساعدك على حساب الكميات بدقة — ثنائي الأبعاد (الطول × العرض) وثلاثي الأبعاد، مع احتساب نسبة الهدر وتحويلها إلى عدد وحدات جاهز للطلب عبر ودجت متجرك.</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#374151;">جرّب الآن إضافة منتج وتفعيل الحاسبة وإعداد نسبة الهدر.</p>
  @else
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">تم تفعيل اشتراكك في {{ $appAr }} بنجاح ✅</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;">شكراً لثقتك بـ QUANTIX. اشتراكك في <strong>{{ $appAr }}</strong> أصبح نشطاً الآن.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;"><strong>{{ $appAr }}</strong> يوفر لعملائك حساباً فورياً ودقيقاً للكميات مباشرة في صفحة المنتج — مما يزيد التحويل ويقلل الأخطاء.</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#374151;">استمتع بجميع المزايا دون قيود.</p>
  @endif
@endif
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="padding:8px 0;">
<a href="{{ $appUrl }}" style="display:inline-block;background:#523859;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;">فتح التطبيق</a>
</td></tr></table>
<p style="margin:16px 0 0;font-size:14px;line-height:1.8;color:#374151;">تحتاج إلى مساعدة؟<br><a href="{{ $supportUrl }}" style="color:#523859;font-weight:700;text-decoration:underline;">تواصل مع فريق الدعم</a></p>
</td></tr>

<tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"></td></tr>

{{-- English Section SECOND --}}
<tr><td dir="ltr" style="padding:32px;background:#ffffff;text-align:left;">
@if($appName === 'harees')
  @if($isTrial)
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">Welcome to {{ $appEn }} — Your trial has started 🎉</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;">Thanks for choosing <strong>{{ $appEn }}</strong> by QUANTIX. Your trial is now active.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;"><strong>{{ $appEn }}</strong> tracks expiry dates automatically, organizes batches, applies discounts before expiry, and hides expired products — reducing waste and improving customer trust.</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#374151;">Start by adding your first batches and exploring the dashboard.</p>
  @else
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">Your {{ $appEn }} subscription is now active ✅</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;">Thank you for trusting QUANTIX. Your <strong>{{ $appEn }}</strong> subscription is now active.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;"><strong>{{ $appEn }}</strong> handles expiry monitoring, automatic discounts, and Salla sync — so it runs reliably in the background.</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#374151;">You now have full access to all features.</p>
  @endif
@else
  @if($isTrial)
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">Welcome to {{ $appEn }} — Your trial has started 🎉</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;">Thanks for choosing <strong>{{ $appEn }}</strong> by QUANTIX. Your trial is now active.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;"><strong>{{ $appEn }}</strong> calculates quantities precisely — 2D (length × width) and 3D, including waste percentage, directly on your store product page.</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#374151;">Try enabling the calculator on a product and configuring waste.</p>
  @else
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">Your {{ $appEn }} subscription is now active ✅</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;">Thank you for trusting QUANTIX. Your <strong>{{ $appEn }}</strong> subscription is now active.</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:#374151;"><strong>{{ $appEn }}</strong> gives your customers instant, accurate quantity calculation on the product page — boosting conversion and reducing errors.</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#374151;">Enjoy full access without limits.</p>
  @endif
@endif
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="padding:8px 0;">
<a href="{{ $appUrl }}" style="display:inline-block;background:#523859;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;">Open Application</a>
</td></tr></table>
<p style="margin:16px 0 0;font-size:14px;line-height:1.8;color:#374151;">Need help?<br><a href="{{ $supportUrl }}" style="color:#523859;font-weight:700;text-decoration:underline;">Contact our support team</a></p>
</td></tr>

<tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;font-size:12px;color:#6b7280;">
QUANTIX — Smart Inventory & Quantity Manager<br>
<a href="{{ $supportUrl }}" style="color:#523859;">Support</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
