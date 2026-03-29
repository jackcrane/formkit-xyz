import dotenv from "dotenv";
import { readFile } from "fs/promises";
import path from "path";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const migrationPath = path.resolve("./migrate.sql");

const requireDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for submission logging.");
  }
};

requireDatabaseUrl();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sqlLiteral = (value) => {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Cannot serialize non-finite number: ${value}`);
    }

    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
};

const sqlJson = (value) => `${sqlLiteral(JSON.stringify(value ?? {}))}::jsonb`;

export const runSubmissionMigrations = async () => {
  const sql = await readFile(migrationPath, "utf8");
  await pool.query(sql);
};

export const createSubmissionRecord = async (submission) => {
  const sql = `
    INSERT INTO form_submissions (
      request_method,
      request_path,
      request_query,
      source_url,
      source_ip,
      forwarded_for,
      user_agent,
      origin_header,
      content_type,
      to_email,
      cc_email,
      bcc_email,
      reply_to_email,
      subject,
      next_url,
      submission_metadata,
      form_data,
      file_fields,
      file_attachments,
      file_count,
      total_file_size_bytes,
      delivery_status
    ) VALUES (
      ${sqlLiteral(submission.requestMethod)},
      ${sqlLiteral(submission.requestPath)},
      ${sqlJson(submission.requestQuery)},
      ${sqlLiteral(submission.sourceUrl)},
      ${sqlLiteral(submission.sourceIp)},
      ${sqlLiteral(submission.forwardedFor)},
      ${sqlLiteral(submission.userAgent)},
      ${sqlLiteral(submission.originHeader)},
      ${sqlLiteral(submission.contentType)},
      ${sqlLiteral(submission.toEmail)},
      ${sqlLiteral(submission.ccEmail)},
      ${sqlLiteral(submission.bccEmail)},
      ${sqlLiteral(submission.replyToEmail)},
      ${sqlLiteral(submission.subject)},
      ${sqlLiteral(submission.nextUrl)},
      ${sqlJson(submission.submissionMetadata)},
      ${sqlJson(submission.formData)},
      ${sqlJson(submission.fileFields)},
      ${sqlJson(submission.fileAttachments)},
      ${sqlLiteral(submission.fileCount ?? 0)},
      ${sqlLiteral(submission.totalFileSizeBytes ?? 0)},
      'pending'
    )
    RETURNING id;
  `;

  const result = await pool.query(sql);
  const id = Number(result.rows[0]?.id);

  if (!Number.isInteger(id)) {
    throw new Error(`Unexpected submission id returned by database: ${id}`);
  }

  return id;
};

export const updateSubmissionRecord = async (id, update) => {
  const assignments = [
    `delivery_status = ${sqlLiteral(update.deliveryStatus)}`,
    `delivery_error = ${sqlLiteral(update.deliveryError)}`,
    `provider_message_id = ${sqlLiteral(update.providerMessageId)}`,
    `response_status = ${sqlLiteral(update.responseStatus)}`,
  ];

  if (update.deliveryStatus === "sent") {
    assignments.push("delivered_at = NOW()");
  }

  const sql = `
    UPDATE form_submissions
    SET ${assignments.join(", ")}
    WHERE id = ${sqlLiteral(id)};
  `;

  await pool.query(sql);
};
