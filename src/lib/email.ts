import "server-only";
import { Resend } from "resend";
import { APP_NAME } from "@/lib/utils";

let client: Resend | null = null;
function resend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

const FROM = () => process.env.RESEND_FROM_EMAIL || `${APP_NAME} <onboarding@resend.dev>`;

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendDeliveryEmail(input: {
  to: string;
  buyerName?: string | null;
  productTitle: string;
  downloadUrl: string;
  sellerName?: string | null;
  brandColor?: string;
  coverUrl?: string | null;
}) {
  const color = input.brandColor || "#7C3AED";
  const greeting = input.buyerName ? `Hi ${escape(input.buyerName.split(" ")[0])},` : "Hi there,";
  const html = `<!doctype html>
<html><body style="margin:0;background:#f6f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;padding:32px">
      ${input.coverUrl ? `<tr><td align="center" style="padding-bottom:24px"><img src="${escape(input.coverUrl)}" width="160" style="border-radius:8px;display:block" alt=""></td></tr>` : ""}
      <tr><td>
        <p style="font-size:16px;margin:0 0 12px">${greeting}</p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 24px">Thanks for your purchase. Your copy of <strong>${escape(input.productTitle)}</strong> is ready.</p>
        <p style="margin:0 0 24px"><a href="${escape(input.downloadUrl)}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:10px">Download your ebook</a></p>
        <p style="font-size:13px;line-height:1.6;color:#666;margin:0">Save this email. The button above works any time you need a fresh download.</p>
        ${input.sellerName ? `<p style="font-size:13px;color:#666;margin:16px 0 0">From ${escape(input.sellerName)}</p>` : ""}
      </td></tr>
    </table>
    <p style="font-size:12px;color:#999;margin-top:16px">Delivered by ${escape(APP_NAME)}</p>
  </td></tr></table>
</body></html>`;

  const { error } = await resend().emails.send({
    from: FROM(),
    to: input.to,
    subject: `Your download: ${input.productTitle}`,
    html,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
