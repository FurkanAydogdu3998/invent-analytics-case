import express from 'express';
import {PrismaClient} from '@prisma/client';
import {ICreateUser, ICreateBook, IReturnBook, IError} from './types/types';
import Ajv from 'ajv';
import {createUserSchema, createBookSchema, returnBookSchema} from './types/schemas.js';

const app = express();

const port = 3000;

const prisma = new PrismaClient();

await prisma.$connect();
console.log('prisma connected');

const ajv = new Ajv();

app.post('/users', express.json(), async function (req, res, next) {
    const validate = ajv.compile(createUserSchema);
    const valid = validate(req.body);

    if (!valid) {
      next({
        status: 422,
        return: {
          statusCode: 422,
          message: 'Request body is not valid',
          validationResults: validate.errors,
        },
      });
      return;
    }

    const user: ICreateUser = req.body;

    const createdUser = await prisma.user.create({
      data: user,
    });

    res.json(createdUser);
});

app.post('/books', express.json(), async function (req, res, next) {
  const body: ICreateBook = req.body;

  const validate = ajv.compile(createBookSchema);
    const valid = validate(req.body);

    if (!valid) {
      next({
        status: 422,
        return: {
          statusCode: 422,
          message: 'Request body is not valid',
          validationResults: validate.errors,
        },
      });
      return;
    }

  const createdBook = await prisma.book.create({
    data: body,
  });

  res.json(createdBook);
});

app.get('/users', async function (req, res) {
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  
  res.json(allUsers);
});

app.get('/books', async function (req, res) {
  const books = await prisma.book.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  res.json(books);
});

app.get('/users/:userId', async function (req, res, next) {
  const routeParams = req.params;
  const userId = Number(routeParams['userId']);

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    include: {
      borrowedBooks: {
        include: {
          book: {
            select: {
              name: true,
              score: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    next({
      status: 422,
      return: {
        statusCode: 422,
        message: `No user can be found with id: ${userId}`,
      }
    })
    return;
  }

  const borrowedBooks = user.borrowedBooks;
  const stillBorrows: object[] = [];
  const borrowedAtPast: object[] = [];

  borrowedBooks.forEach(borrowedBook => {
    if (borrowedBook.stillBorrows) stillBorrows.push(borrowedBook.book);
    else borrowedAtPast.push(borrowedBook.book);
  });

  res.json({
    id: user.id,
    name: user.name,
    books: {
      past: borrowedAtPast,
      present: stillBorrows,
    },
  });
});

app.get('/books/:bookId', async function (req, res, next) {
  const routeParams = req.params;
  const bookId = Number(routeParams['bookId']);

  const book = await prisma.book.findFirst({
    select: {
      id: true,
      name: true,
      score: true,
    },
    where: {
      id: bookId,
    },
  });

  if (!book) {
    next({
      status: 422,
      return : {
        statusCode: 422,
        message: `No book can be found with id: ${bookId}`,
      },
    });
    return;
  }

  res.json(book);
});

app.post('/users/:userId/borrow/:bookId', async function (req, res, next) {
  const routeParams = req.params;
  const userId = Number(routeParams['userId']);
  const bookId = Number(routeParams['bookId']);

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    include: {
      borrowedBooks: {
        where: {
          whichBook: bookId,
        },
      },
    },
  });

  if (!user) {
    next({
      status: 422,
      return: {
        statusCode: 422,
        message: `No user can be found with id: ${userId}`,
      },
    });
    return;
  }

  const userAlreadyBorrowedThisBook = user.borrowedBooks.length;

  if (userAlreadyBorrowedThisBook) {
    let message: string = '';
    message = user.borrowedBooks[0].stillBorrows ? 'You already borrowed this book' : 'You borrowed this book at past';
    next({
      status: 422,
      return: {
        statusCode: 422,
        message: message,
      },
    });
    return;
  }

  const isBookBorrowedBySomeoneElse = await prisma.borrowBook.findFirst({
    where: {
      whichBook: bookId,
      stillBorrows: true,
    },
  });

  if (isBookBorrowedBySomeoneElse) {
    next({
      status: 422,
      return: {
        statusCode: 422,
        message: 'Book borrowed by someone else at this time'
      },
    });
    return;
  }

  const book = await prisma.book.findFirst({
    where: {
      id: bookId,
    },
  });

  if (!book) {
    next({
      status: 422,
      return: {
        statusCode: 422,
        message: `No book can be found with given id: ${bookId}`,
      },
    });
    return;
  }

  const borrowedBook = await prisma.borrowBook.create({
    data: {
      whichBook: bookId,
      whoBorrows: userId,
      stillBorrows: true,
    },
  });

  res.json(borrowedBook);
});

app.post('/users/:userId/return/:bookId', express.json(), async function (req, res, next) {
  const routeParams = req.params;
  const userId = Number(routeParams['userId']);
  const bookId = Number(routeParams['bookId']);

  const body: IReturnBook = req.body;
  const validate = ajv.compile(returnBookSchema);
  const valid = validate(body);

  if (!valid) {
    next({
      status: 422,
      return: {
        statusCode: 422,
        message: 'Request body is not valid',
        validationResult: validate.errors,
      },
    });
    return;
  }

  const userScore = body.score;

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    include: {
      borrowedBooks: {
        where: {
          whichBook: bookId,
          stillBorrows: true,
        },
        include: {
          book: true,
        },
      },
    },
  });

  if (!user) {
    next({
      status: 422,
      return: {
        statusCode: 422,
        message: `No user can be found with id: ${userId}`,
      },
    });
    return;
  }

  const bookBorrowedByThisUser = user.borrowedBooks.length;

  if (!bookBorrowedByThisUser) {
    next({
      status: 422,
      return: {
        statusCode: 422,
        message: 'This book does not borrowed by this user',
      },
    });
    return;
  }

  await prisma.borrowBook.update({
    where: {id: user.borrowedBooks[0].id},
    data: {
      stillBorrows: false,
    },
  });

  const book = user.borrowedBooks[0].book;

  const booksScore = book.score;
  const scoredBy = book.scoredBy;

  const newScore = ((booksScore * scoredBy) + userScore) / (scoredBy + 1);

  await prisma.book.update({
    where: {
      id: bookId,
    },
    data: {
      score: newScore,
      scoredBy: scoredBy + 1,
    },
  });

  res.json();
});

// @ts-ignore
app.use(async function(err: IError, req, res, next) {
  res.status(err.status);
  res.json({error: err.return});
});
  
app.listen(port)
console.log('app is listening now at port 3000');