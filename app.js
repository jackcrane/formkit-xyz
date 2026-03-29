import express from "express";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";
import { renderResponseEmail } from "./lib/renderEmail.js";
import {
  createSubmissionRecord,
  runSubmissionMigrations,
  updateSubmissionRecord,
} from "./lib/submissionStore.js";

dotenv.config();

const confirmationPath = path.resolve("./public/confirmation.html");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 9 * 1024 * 1024 },
});

const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/donate", (req, res) => {
  const donateUrl = process.env.DONATE_URL;

  if (!donateUrl) {
    return res.status(404).send("Donate URL is not configured.");
  }

  res.redirect(donateUrl);
});

// Disallowed file extensions
const disallowedExtensions = new Set([
  "vbs",
  "exe",
  "bin",
  "bat",
  "chm",
  "com",
  "cpl",
  "crt",
  "hlp",
  "hta",
  "inf",
  "ins",
  "isp",
  "jse",
  "lnk",
  "mdb",
  "pcd",
  "pif",
  "reg",
  "scr",
  "sct",
  "shs",
  "vbe",
  "vba",
  "wsf",
  "wsh",
  "wsl",
  "msc",
  "msi",
  "msp",
  "mst",
]);

const isExtensionAllowed = (filename) => {
  const extension = filename.split(".").pop().toLowerCase();
  return !disallowedExtensions.has(extension);
};

const normalizeScalar = (value) => {
  if (Array.isArray(value)) {
    return normalizeScalar(value[0]);
  }

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
};

const getSourceIp = (req) => {
  const forwardedFor = normalizeScalar(req.headers["x-forwarded-for"]);

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || null;
};

app.post("/", upload.any(), async (req, res) => {
  let submissionId = null;
  let emailSent = false;

  try {
    const files = req.files || []; // Ensure it's an array

    if (files.length > 50) {
      return res.status(400).send("Cannot upload more than 50 files.");
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 9 * 1024 * 1024) {
      return res.status(400).send("Total file size exceeds 9 MB.");
    }

    for (const file of files) {
      if (!isExtensionAllowed(file.originalname)) {
        return res
          .status(400)
          .send(`File "${file.originalname}" has a disallowed extension.`);
      }
    }

    const metadata = {};
    const submissionMetadata = {};
    const formData = {};
    const parsedBody = [];
    for (const [key, value] of Object.entries(req.body || {})) {
      if (key[0] !== "_") {
        formData[key] = value;
        parsedBody.push({
          name: key,
          value,
        });
        if (key === "email") {
          metadata.replyTo = value;
        }
      } else {
        if (key === "_replyto") {
          metadata.replyTo = value;
        }
        if (key === "_next") {
          metadata.next = value;
        }
        if (key === "_subject") {
          metadata.subject = value;
        }
        if (key === "_cc") {
          metadata.cc = value;
        }
        if (key === "_bcc") {
          metadata.bcc = value;
        }
        if (
          key !== "_replyto" &&
          key !== "_next" &&
          key !== "_subject" &&
          key !== "_cc" &&
          key !== "_bcc"
        ) {
          submissionMetadata[key] = value;
        }
      }
    }

    const fileFields = {};
    for (const file of files) {
      if (fileFields[file.fieldname]) {
        fileFields[file.fieldname].push({
          name: file.originalname,
          size: file.size,
        });
      } else {
        fileFields[file.fieldname] = [
          {
            name: file.originalname,
            size: file.size,
          },
        ];
      }
    }

    const flatFileFields = Object.values(fileFields).flat();
    const totalFileSizeBytes = files.reduce((sum, file) => sum + file.size, 0);
    const sourceUrl =
      normalizeScalar(req.headers.referrer) ||
      normalizeScalar(req.headers.referer) ||
      normalizeScalar(req.headers.origin);
    const toEmail = normalizeScalar(req.query.email);

    submissionId = await createSubmissionRecord({
      requestMethod: req.method,
      requestPath: req.path,
      requestQuery: req.query || {},
      sourceUrl,
      sourceIp: getSourceIp(req),
      forwardedFor: normalizeScalar(req.headers["x-forwarded-for"]),
      userAgent: normalizeScalar(req.headers["user-agent"]),
      originHeader: normalizeScalar(req.headers.origin),
      contentType: normalizeScalar(req.headers["content-type"]),
      toEmail,
      ccEmail: metadata.cc,
      bccEmail: metadata.bcc,
      replyToEmail: metadata.replyTo,
      subject: metadata.subject,
      nextUrl: metadata.next,
      submissionMetadata,
      formData,
      fileFields,
      fileAttachments: flatFileFields,
      fileCount: files.length,
      totalFileSizeBytes,
    });

    const email = await renderResponseEmail(
      toEmail,
      sourceUrl,
      parsedBody,
      fileFields,
      flatFileFields,
      metadata
    );
    emailSent = true;

    try {
      await updateSubmissionRecord(submissionId, {
        deliveryStatus: "sent",
        deliveryError: null,
        providerMessageId: email?.MessageID || null,
        responseStatus: 200,
      });
    } catch (updateError) {
      console.error("Failed to mark submission as sent:", updateError);
    }

    res.sendFile(confirmationPath);
  } catch (error) {
    console.error(error);

    if (submissionId !== null && !emailSent) {
      try {
        await updateSubmissionRecord(submissionId, {
          deliveryStatus: "failed",
          deliveryError: error.message,
          providerMessageId: null,
          responseStatus: 500,
        });
      } catch (updateError) {
        console.error("Failed to update submission record:", updateError);
      }
    }

    res.status(500).send("An error occurred while processing your files.");
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle specific Multer errors
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          error: "One of the files exceeds the maximum allowed size of 9 MB.",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          error: "Too many files uploaded. The maximum allowed is 50.",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          error: "Unexpected file field or too many files uploaded.",
        });
      default:
        return res.status(400).json({
          error: `Upload error: ${err.message}`,
        });
    }
  }

  // Handle other errors
  next(err);
});

// Generic error handling
app.use((err, req, res, next) => {
  res.status(500).json({
    error: "An unexpected error occurred.",
    details: err.message,
  });
});

const start = async () => {
  await runSubmissionMigrations();

  app.listen(3001, () => {
    console.log(`Listening on port 3001`);
  });
};

start().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
