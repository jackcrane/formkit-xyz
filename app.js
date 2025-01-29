import express from "express";
import multer from "multer";
import path from "path";
import { renderResponseEmail } from "./lib/renderEmail.js";
const confirmationPath = path.resolve("./public/confirmation.html");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 9 * 1024 * 1024 },
});

const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.post("/", upload.any(), async (req, res) => {
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

    const parsedBody = [];
    const metadata = {};
    for (const [key, value] of Object.entries(req.body || {})) {
      if (key[0] !== "_") {
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

    await renderResponseEmail(
      req.query.email,
      req.headers.referrer || req.headers.referer,
      parsedBody,
      fileFields,
      flatFileFields,
      metadata
    );

    res.sendFile(confirmationPath);
  } catch (error) {
    console.error(error);
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

app.listen(3001, () => {
  console.log(`Listening on port 3001`);
});
