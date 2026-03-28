/** Builds a luxury dark-themed HTML confirmation email (inline CSS for email-client compat). */

export interface EmailOrderItem {
    name:       string;
    quantity:   number;
    unitPrice:  number;  // SAR
}

export interface EmailTemplateOptions {
    customerEmail: string;
    items:         EmailOrderItem[];
    totalSAR:      number;
    language:      "en" | "ar";
    orderRef:      string; // Stripe PaymentIntent ID
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const BG      = "#0D0A07";
const BG2     = "#1A0E08";
const GOLD    = "#C9A84C";
const GOLD2   = "#E5C84A";
const TEXT     = "#EBE5D9";
const MUTED   = "#8B7355";
const BORDER  = "#2A1E12";

// ─── Template ────────────────────────────────────────────────────────────────
export function buildConfirmationEmail(opts: EmailTemplateOptions): string {
    const { items, totalSAR, language, orderRef } = opts;
    const isAr = language === "ar";
    const dir  = isAr ? "rtl" : "ltr";

    const t = {
        subject:    isAr ? "شكراً لاختياركم عطور إدما" : "Thank you for choosing Edma",
        brand:      "EDMA PERFUME",
        headline:   isAr ? "طلبك على الطريق" : "Your order is on its way",
        subhead:    isAr
            ? "نشكرك على اختيارك عطور إدما. لقد تلقينا طلبك بنجاح."
            : "Thank you for your purchase. Your order has been received and is being prepared with care.",
        orderRef:   isAr ? "رقم الطلب" : "Order Reference",
        summary:    isAr ? "ملخص الطلب" : "Order Summary",
        product:    isAr ? "المنتج" : "Product",
        qty:        isAr ? "الكمية" : "Qty",
        price:      isAr ? "السعر" : "Price",
        total:      isAr ? "المجموع" : "Total",
        shipping:   isAr ? "التوصيل" : "Delivery",
        free:       isAr ? "مجاني" : "Free",
        tagline:    isAr
            ? "أناقة خفية. حضور لا يُنسى."
            : "Invisible elegance. Unforgettable presence.",
        footer:     isAr
            ? "© 2025 عطور إدما. جميع الحقوق محفوظة."
            : "© 2025 Edma Perfume. All rights reserved.",
        questions:  isAr
            ? "هل لديك أسئلة؟ تواصل معنا عبر الواتساب"
            : "Questions? Reach us via WhatsApp",
    };

    const fmtPrice = (n: number) =>
        isAr ? `${n} ر.س` : `${n} SAR`;

    const itemRows = items.map(item => `
        <tr>
            <td style="padding:12px 0; border-bottom:1px solid ${BORDER}; color:${TEXT}; font-size:14px;" dir="${dir}">
                ${item.name}
            </td>
            <td style="padding:12px 8px; border-bottom:1px solid ${BORDER}; text-align:center; color:${MUTED}; font-size:13px;">
                ×${item.quantity}
            </td>
            <td style="padding:12px 0; border-bottom:1px solid ${BORDER}; text-align:${isAr ? "left" : "right"}; color:${GOLD}; font-size:13px; white-space:nowrap;">
                ${fmtPrice(item.unitPrice * item.quantity)}
            </td>
        </tr>
    `).join("");

    return `<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${t.subject}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:Georgia,'Times New Roman',serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BG2};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">

          <!-- ── Header ───────────────────────────────────── -->
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid ${BORDER};">
              <!-- Gold ornament line -->
              <div style="margin:0 auto 20px;width:60px;height:1px;background:linear-gradient(90deg,transparent,${GOLD},transparent);"></div>

              <div style="font-size:10px;letter-spacing:0.5em;color:${GOLD};text-transform:uppercase;font-family:Arial,sans-serif;font-weight:400;margin-bottom:8px;">
                E &nbsp; D &nbsp; M &nbsp; A
              </div>
              <div style="font-size:11px;letter-spacing:0.3em;color:${MUTED};text-transform:uppercase;font-family:Arial,sans-serif;font-weight:300;">
                PERFUME
              </div>

              <div style="margin:24px auto;width:40px;height:1px;background:linear-gradient(90deg,transparent,${GOLD}60,transparent);"></div>

              <h1 style="margin:0;font-size:24px;font-weight:400;color:${TEXT};letter-spacing:0.05em;line-height:1.3;">
                ${t.headline}
              </h1>
              <p style="margin:12px 0 0;font-size:14px;color:${MUTED};line-height:1.7;font-family:Arial,sans-serif;font-weight:300;">
                ${t.subhead}
              </p>
            </td>
          </tr>

          <!-- ── Order ref pill ──────────────────────────── -->
          <tr>
            <td style="padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${BG};border:1px solid ${BORDER};border-radius:8px;padding:14px 20px;">
                    <span style="font-size:11px;color:${MUTED};font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.2em;">${t.orderRef}</span>
                    <br/>
                    <span style="font-size:12px;color:${GOLD};font-family:'Courier New',monospace;letter-spacing:0.05em;word-break:break-all;">${orderRef}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Order summary ───────────────────────────── -->
          <tr>
            <td style="padding:0 40px 8px;">
              <p style="margin:0 0 16px;font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.25em;font-family:Arial,sans-serif;">
                ${t.summary}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <!-- Column headers -->
                <tr>
                  <th style="padding-bottom:10px;text-align:${isAr ? "right" : "left"};font-size:10px;color:${MUTED};font-family:Arial,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:0.2em;border-bottom:1px solid ${BORDER};">${t.product}</th>
                  <th style="padding-bottom:10px;text-align:center;font-size:10px;color:${MUTED};font-family:Arial,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:0.2em;border-bottom:1px solid ${BORDER};">${t.qty}</th>
                  <th style="padding-bottom:10px;text-align:${isAr ? "left" : "right"};font-size:10px;color:${MUTED};font-family:Arial,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:0.2em;border-bottom:1px solid ${BORDER};">${t.price}</th>
                </tr>
                <!-- Items -->
                ${itemRows}
                <!-- Delivery row -->
                <tr>
                  <td style="padding:12px 0;color:${MUTED};font-size:13px;font-family:Arial,sans-serif;" colspan="2">${t.shipping}</td>
                  <td style="padding:12px 0;text-align:${isAr ? "left" : "right"};color:${GOLD};font-size:13px;font-family:Arial,sans-serif;">${t.free}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Total row ────────────────────────────────── -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${GOLD}30;margin-top:4px;">
                <tr>
                  <td style="padding:16px 0 0;font-size:13px;color:${MUTED};font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.2em;">${t.total}</td>
                  <td style="padding:16px 0 0;text-align:${isAr ? "left" : "right"};">
                    <span style="font-size:22px;color:${GOLD2};font-weight:400;letter-spacing:0.05em;">${fmtPrice(totalSAR)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Tagline banner ──────────────────────────── -->
          <tr>
            <td style="padding:24px 40px;text-align:center;background:linear-gradient(135deg,${BG}80,${BG2});border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};">
              <p style="margin:0;font-size:13px;color:${GOLD}90;letter-spacing:0.15em;font-style:italic;">
                ${t.tagline}
              </p>
            </td>
          </tr>

          <!-- ── Footer ──────────────────────────────────── -->
          <tr>
            <td style="padding:28px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;color:${MUTED};font-family:Arial,sans-serif;">${t.questions}</p>
              <div style="margin:16px auto;width:40px;height:1px;background:linear-gradient(90deg,transparent,${BORDER},transparent);"></div>
              <p style="margin:0;font-size:10px;color:${BORDER};font-family:Arial,sans-serif;letter-spacing:0.1em;">${t.footer}</p>
            </td>
          </tr>

        </table>
        <!-- /Card -->
      </td>
    </tr>
  </table>

</body>
</html>`;
}
