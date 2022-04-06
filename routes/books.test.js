process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db')

let book_isbn;

beforeEach(async () => {
    let results = await db.query(`
        INSERT INTO books(isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES(
            '1233211234567',
            'https://amazon.com/books',
            'Cynthia',
            'English',
            70,
            'Publishers',
            'Great book',
            2001
        )
        RETURNING isbn
    `);
    book_isbn = results.rows[0].isbn
})

describe('GET /books', function() {
    test('Get books', async function() {
        const response = await request(app).get('/books')
        const books = response.body.books
        expect(books).toHaveLength(1)
        expect(books[0]).toHaveProperty('isbn')
    })
})

describe('GET /books/:isbn', function() {
    test('Get a book', async function() {
        const response = await request(app).get(`/books/${book_isbn}`)
        const books = response.body.book
        expect(books).toHaveProperty('isbn')
        expect(books.isbn).toBe(book_isbn)
    })
    test('404 if can not find book by isbn', async function() {
        const response = await request(app).get('/books/0')
        expect(response.statusCode).toBe(404)
    })
})

describe('POST /books', function() {
    test('Create a new book', async function() {
        const response = await request(app).post('/books').send({
            isbn: '1234567',
            amazon_url: 'https://new.com',
            author: 'new author',
            language: 'new language',
            pages: 1000,
            publisher: 'new publisher',
            title: 'new title',
            year: 2022
        })
        expect(response.statusCode).toBe(201)
        expect(response.body.book).toHaveProperty('isbn')
    })
})

describe('PUT /books/:isbn', function() {
    test('Update a book', async function() {
        const response = await request(app).put(`/books/${book_isbn}`).send({
            amazon_url: 'https://new.com',
            author: 'new author',
            language: 'new language',
            pages: 1000,
            publisher: 'new publisher',
            title: 'update title',
            year: 2022
        })
        expect(response.body.book).toHaveProperty('isbn')
        expect(response.body.book.title).toBe('update title')
    })
    test('404 if can not find book by isbn', async function() {
        const response = await request(app).get('/books/0')
        expect(response.statusCode).toBe(404)
    })
})

describe('DELETE /books/:isbn', function() {
    test('Delete a book', async function() {
        const response = await request(app).delete(`/books/${book_isbn}`)
        expect(response.body).toEqual({ message: "Book deleted" })
    })
    test('404 if can not find book by isbn', async function() {
        const response = await request(app).get('/books/0')
        expect(response.statusCode).toBe(404)
    })
})

afterEach(async function() {
    await db.query('DELETE FROM BOOKS')
})

afterAll(async function() {
    await db.end()
})

