import {
  Body,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Link,
  Text,
} from "@react-email/components";
import * as React from "react";

String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, "g"), replacement);
};

const gfss = (size) => {
  if (size < 1024) {
    return `${size} bytes`;
  }
  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

export const FormkitResponseEmail = ({
  referrer,
  filteredFormData,
  fileAttachments,
  flatFileAttachments,
}) =>
  false ? (
    <Html>
      {JSON.stringify({ referrer, filteredFormData, fileAttachments })}
    </Html>
  ) : (
    <Html style={body}>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <Font
          fontFamily="frl" //Frank Ruhl Libre
          fallbackFontFamily={"serif"}
          webFont={{
            url: "https://fonts.gstatic.com/s/frankruhllibre/v21/j8_96_fAw7jrcalD7oKYNX0QfAnPcbzNEEB7OoicBw7FYWqXNRVUFFR-398.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>New Formkit Response</Preview>
      <Body style={main}>
        <Container>
          <div style={container}>
            <div style={header}>
              <Heading as="h1" style={my0}>
                <Link href="https://formkit.xyz" target="_blank" style={h1}>
                  Formkit
                </Link>
                <span style={secondary}>.xyz</span>
              </Heading>
              <div style={subheading}>New Formkit Response</div>
            </div>
            <div style={content}>
              <Heading as="h2" style={subtitle}>
                Your form has been submitted!
              </Heading>
              <Text style={mt1}>
                Someone just submitted your form on{" "}
                <Link href={referrer} target="_blank" style={link}>
                  {referrer}
                </Link>{" "}
                at <i>{new Date().toUTCString()}</i>. Here's what they had to
                say:
              </Text>
              <table style={table}>
                <tbody>
                  {filteredFormData.map((field) => (
                    <tr>
                      <td style={td}>
                        <Text style={fieldstyle}>{field.name}</Text>
                      </td>
                      <td style={td}>
                        <Text style={value}>
                          <span
                            style={bgspan}
                            dangerouslySetInnerHTML={{
                              __html: field.value.replaceAll("\n", "<br />"),
                            }}
                          ></span>
                        </Text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {flatFileAttachments?.length > 0 && (
                <>
                  <Heading as="h3" style={subtitle}>
                    File Attachments
                  </Heading>
                  <Text style={mt1}>
                    There {flatFileAttachments.length > 1 ? "were" : "was"}{" "}
                    {flatFileAttachments.length} file
                    {flatFileAttachments.length > 1 && "s"} attached to this
                    form. The file{flatFileAttachments.length > 1 && "s"}{" "}
                    {flatFileAttachments.length > 1 ? "are" : "is"} attached to
                    this email. Details on the file
                    {flatFileAttachments.length > 1 && "s"}{" "}
                    {flatFileAttachments.length > 1 ? "are" : "is"} in the table
                    below.
                  </Text>
                  {Object.keys(fileAttachments).map((field) => (
                    <>
                      <Heading as="h4" style={h4}>
                        {field}
                      </Heading>
                      <table style={table}>
                        <tbody>
                          {fileAttachments[field].map((file) => (
                            <tr>
                              <td style={td}>
                                <Text style={fieldstyle}>{file.name}</Text>
                              </td>
                              <td style={td}>
                                <Text style={value}>{gfss(file.size)}</Text>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ))}
                </>
              )}
              <Text style={mt1}>
                Thanks for using Formkit! If you have any questions, please fill
                out the form on{" "}
                <Link
                  href="https://formkit.xyz/help"
                  target="_blank"
                  style={link}
                >
                  Formkit.xyz/help
                </Link>
                . Also, be sure to be aware of our{" "}
                <Link
                  href="https://formkit.xyz/restrictions-of-service"
                  target="_blank"
                  style={link}
                >
                  rules and restrictions of service
                </Link>
                ,{" "}
                <Link
                  href="https://formkit.xyz/privacy"
                  target="_blank"
                  style={link}
                >
                  privacy policy
                </Link>
                , and{" "}
                <Link
                  href="https://formkit.xyz/terms-of-service"
                  target="_blank"
                  style={link}
                >
                  terms of service
                </Link>
                .
              </Text>
              <Text style={donate}>
                If you have the means, please consider{" "}
                <Link
                  href="https://formkit.xyz/donate"
                  target="_blank"
                  style={donateLink}
                >
                  donating
                </Link>{" "}
                to help keep this service free. It costs about 1 cent per
                submission, so if you are a heavy user, please consider{" "}
                <Link
                  href="https://formkit.xyz/donate"
                  target="_blank"
                  style={donateLink}
                >
                  donating
                </Link>
                . While it stinks, I reserve the right to suspend service on a
                form if it is being abused or is causing extreme strain. I will
                reach out to you beforehand if I need to do so. Details are in
                the{" "}
                <Link
                  href="https://formkit.xyz/restrictions-of-service"
                  target="_blank"
                  style={link}
                >
                  rules and restrictions of service
                </Link>{" "}
                page.
              </Text>
            </div>
          </div>
        </Container>
      </Body>
    </Html>
  );

FormkitResponseEmail.PreviewProps = {
  referrer: "https://formkit.xyz",
  filteredFormData: [
    {
      name: "name",
      value: "John Doe",
    },
    {
      name: "email",
      value: "john@doe.com",
    },
    {
      name: "message",
      value: "Hello, I am a message",
    },
    {
      name: "long message",
      value:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
  ],
  fileAttachments: {
    file: [
      { name: "mock_registrations.json", size: 26795 },
      { name: "mock_registrations_with_jumps.json", size: 27094 },
      { name: "mock_registrations_updated_curve.json", size: 27079 },
      { name: "mock_registrations_curve.json", size: 27142 },
      { name: "mock_registrations_exponential.json", size: 26880 },
      { name: "mock_registrations_randomized.json", size: 26864 },
      { name: "mock_registrations_smaller_jumps.json", size: 26837 },
    ],
    file2: [
      { name: "HW1 2.pdf", size: 1962370 },
      { name: "Spur_M0.5_Pa1_Z10.stl", size: 138084 },
    ],
  },
  flatFileAttachments: [
    { name: "mock_registrations.json", size: 26795 },
    { name: "mock_registrations_with_jumps.json", size: 27094 },
    { name: "mock_registrations_updated_curve.json", size: 27079 },
    { name: "mock_registrations_curve.json", size: 27142 },
    { name: "mock_registrations_exponential.json", size: 26880 },
    { name: "mock_registrations_randomized.json", size: 26864 },
    { name: "mock_registrations_smaller_jumps.json", size: 26837 },
    { name: "HW1 2.pdf", size: 1962370 },
    { name: "Spur_M0.5_Pa1_Z10.stl", size: 138084 },
  ],
};

export default FormkitResponseEmail;

const body = {
  backgroundColor: "#c9c9c9",
  textRendering: "optimizeLegibility",
  WebkitFontSmoothing: "antialiased",
  marginBottom: 100,
};

const main = {
  fontFamily: "frl",
};

const container = {
  backgroundColor: "#f1efee",
  borderRadius: 12,
  overflow: "hidden",
};

const header = {
  backgroundColor: "#0b3d47",
  color: "#e0f1f3",
  padding: "10px 30px",
};

const h1 = {
  margin: 0,
  color: "#e0f1f3",
  textDecoration: "underline",
};

const secondary = {
  color: "#a2b9bc",
  textDecorationColor: "#a2b9bc",
};

const subheading = {
  verticalAlign: "bottom",
  textAlign: "right",
};

const content = {
  padding: "10px 30px",
};

const my0 = {
  marginTop: 0,
  marginBottom: 0,
};

const subtitle = {
  fontSize: 18,
  margin: 0,
};

const mt1 = {
  marginTop: 8,
  marginBottom: 0,
};

const link = {
  color: "#d17128",
  textDecoration: "underline",
};

const fieldstyle = {
  fontWeight: 600,
  margin: 0,
};

const value = {
  margin: 0,
  textAlign: "right",
};

const bgspan = {
  backgroundColor: "#e5e5e5",
  padding: "2px 6px",
  borderRadius: 4,
  display: "inline-block",
};

const td = {
  borderBottom: "2px solid #0b3d4780",
  borderTop: "2px solid #0b3d4780",
  padding: "4px 0",
};

const table = {
  borderCollapse: "collapse",
  width: "100%",
  marginTop: 12,
  marginBottom: 12,
  backgroundColor: "#0b3d47e",
};

const donate = {
  backgroundColor: "#d171282f",
  color: "#d17128",
  marginTop: 12,
  marginBottom: 12,
  outline: "4px solid #d171282f",
};

const donateLink = {
  backgroundColor: "#d17128",
  color: "#e0f1f3",
  textDecoration: "underline",
  textDecorationColor: "#e0f1f3",
  padding: "0px 4px",
};

const h4 = {
  margin: 0,
  marginTop: 12,
  fontSize: 18,
};
