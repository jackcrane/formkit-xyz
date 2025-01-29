import Fkre from "../react-email/emails/FkResponseEmail.jsx";
import { render } from "@react-email/render";
import { writeFileSync } from "fs";
import postmark from "postmark";
import { config } from "dotenv";
config();
const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

export const renderResponseEmail = async (
  to,
  referrer,
  filteredFormData,
  fileAttachments,
  flatFileAttachments,
  metadata
) => {
  const html = await render(
    Fkre.FormkitResponseEmail({
      referrer,
      filteredFormData,
      fileAttachments,
      flatFileAttachments,
    })
  );

  const email = await client.sendEmail({
    From: "Formkit Response <Response@jackcrane.rocks>",
    To: to,
    Subject: metadata.subject || "New Formkit Response",
    ReplyTo: metadata.replyTo,
    Cc: metadata.cc,
    Bcc: metadata.bcc,
    HtmlBody: html,
  });
  console.log(email);

  // writeFileSync("./public/email.html", email);
};
