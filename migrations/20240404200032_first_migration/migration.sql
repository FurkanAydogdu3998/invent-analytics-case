-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT -1,
    "scoredBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowBook" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "whoBorrows" INTEGER NOT NULL,
    "whichBook" INTEGER NOT NULL,
    "stillBorrows" BOOLEAN NOT NULL,

    CONSTRAINT "BorrowBook_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BorrowBook" ADD CONSTRAINT "BorrowBook_whoBorrows_fkey" FOREIGN KEY ("whoBorrows") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowBook" ADD CONSTRAINT "BorrowBook_whichBook_fkey" FOREIGN KEY ("whichBook") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
