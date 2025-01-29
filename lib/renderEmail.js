import Fkre from "../react-email/emails/FkResponseEmail.jsx";
import { render } from "@react-email/render";
import { writeFileSync } from "fs";

export const renderResponseEmail = async (
  to,
  referrer,
  filteredFormData,
  fileAttachments,
  flatFileAttachments
) => {
  console.log({
    to,
    referrer,
    filteredFormData,
    fileAttachments,
  });

  const email = await render(
    Fkre.FormkitResponseEmail({
      referrer,
      filteredFormData,
      fileAttachments,
      flatFileAttachments,
    })
  );

  writeFileSync("./public/email.html", email);
};
