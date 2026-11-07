CREATE TABLE "llm_chat_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "response" TEXT,
    "chatId" TEXT,
    "claimToken" TEXT NOT NULL,
    "leaseExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_chat_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "llm_chat_requests_userId_idempotencyKey_key"
ON "llm_chat_requests"("userId", "idempotencyKey");

CREATE INDEX "llm_chat_requests_status_leaseExpiresAt_idx"
ON "llm_chat_requests"("status", "leaseExpiresAt");

ALTER TABLE "llm_chat_requests"
ADD CONSTRAINT "llm_chat_requests_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
