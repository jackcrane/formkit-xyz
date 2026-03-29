import Fkre from "../react-email/emails/FkResponseEmail.jsx";
import { render } from "@react-email/render";
import postmark from "postmark";
import dotenv from "dotenv";
dotenv.config();
const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

export const renderResponseEmail = async (
  to,
  referrer,
  filteredFormData,
  fileAttachments,
  flatFileAttachments,
  metadata,
) => {
  const html = await render(
    Fkre.FormkitResponseEmail({
      referrer,
      filteredFormData,
      fileAttachments,
      flatFileAttachments,
    }),
  );

  const email = await client.sendEmail({
    From: "Formkit Response <response@formkit.xyz>",
    To: to,
    Subject: metadata.subject || "New Formkit Response",
    ReplyTo: metadata.replyTo,
    Cc: metadata.cc,
    Bcc: metadata.bcc,
    HtmlBody: html,
  });
  console.log(email);

  return email;
};
